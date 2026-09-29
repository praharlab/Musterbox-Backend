const Sequelize = require('sequelize');
const CheckList = require('../models/checklist');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const StateMaster = require('../models/statemaster');
const fs = require('fs');
const Designation = require('../models/designation');
const { executeQuery } = require('./common.controller');
const companyMaster = require('../models/companyMaster');
const UserChecklist = require('../models/userCheckList');

exports.postAddCheckList = async (req, res, next) => {
  try {
    let { designationId, checkListName, pastdays, createBy, createByIp } =
      await req.body;

    const companyData = await Designation.findOne({
      where: {
        designationId: designationId,
      },
      raw: true,
    });

    const UniqueData = await executeQuery(
      `SELECT * from "checklists" where LOWER(TRIM("checkListName"))='` +
        checkListName.trim().toLowerCase() +
        `' and "designationId" in (SELECT "designationId" from "designations" where "companyMasterID"=` +
        companyData.companyMasterID +
        `)`
    );

    if (UniqueData.length > 0) {
      return res.status(200).send({
        status: 401,
        message: 'Checklist with same name already exist',
      });
    }

    // let result = await sequelize.transaction(async (t) => {
    let insert_db_status = await CheckList.create(
      {
        designationId,
        checkListName,
        pastdays,
        createBy,
        createByIp,
      }
      // { transaction: t }
    );

    return res.status(200).json({
      status: 200,
      message: 'CheckList Added Successfully',
      data: insert_db_status,
    });

    // });
  } catch (err) {
    next(err);
  }
};

exports.getAllCheckList = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, companyMasterID, designationId } =
      await req.body;
    let offset = (page - 1) * limit;
    let checkList = [],
      totalcount = 0;

    if (page && limit) {
      if (searchQuery) {
        const companyid = [];
        companyid.push(parseInt(companyMasterID));
        let get_one_data = await companyMaster.findAll({
          where: { parentCompanyMasterID: companyMasterID, status: [0, 1] },
        });
        for (var i = 0; i < get_one_data.length; i++) {
          companyid.push(get_one_data[i].companyMasterID);
        }

        checkList = await CheckList.findAll({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              {
                checkListName: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$designation.designationName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$designation.companyMaster.companyName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            status: ['0', '1'],
            '$designation.companyMaster.companyMasterID$': companyid,
          },
          limit: limit,
          offset: offset,
          include: [
            {
              model: Designation,
              attributes: ['designationName'],
              include: [{ model: companyMaster, attributes: ['companyName'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = await CheckList.count({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              {
                checkListName: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$designation.designationName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$designation.companyMaster.companyName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            status: ['0', '1'],
            '$designation.companyMaster.companyMasterID$': companyid,
          },
          include: [
            {
              model: Designation,
              attributes: ['designationName'],
              include: [{ model: companyMaster, attributes: ['companyName'] }],
            },
          ],
        });
      } else if (designationId) {
        checkList = await CheckList.findAll({
          raw: true,
          where: {
            designationId: designationId,
            status: ['0', '1'],
          },
          limit: limit,
          offset: offset,
          include: [
            {
              model: Designation,
              attributes: ['designationName'],
              include: [{ model: companyMaster, attributes: ['companyName'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = await CheckList.count({
          raw: true,
          where: {
            designationId: designationId,
            status: ['0', '1'],
          },
        });
      } else if (companyMasterID) {
        const companyid = [];
        companyid.push(parseInt(companyMasterID));
        let get_one_data = await companyMaster.findAll({
          where: { parentCompanyMasterID: companyMasterID, status: [0, 1] },
        });
        for (var i = 0; i < get_one_data.length; i++) {
          companyid.push(get_one_data[i].companyMasterID);
        }

        checkList = await CheckList.findAll({
          raw: true,
          where: {
            '$designation.companyMaster.companyMasterID$': companyid,
            status: ['0', '1'],
          },
          limit: limit,
          offset: offset,
          include: [
            {
              model: Designation,
              attributes: ['designationName'],
              include: [{ model: companyMaster, attributes: ['companyName'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = await CheckList.count({
          raw: true,
          where: {
            '$designation.companyMaster.companyMasterID$': companyid,
            status: ['0', '1'],
          },
          include: [
            {
              model: Designation,
              attributes: ['designationName'],
              include: [{ model: companyMaster, attributes: ['companyName'] }],
            },
          ],
        });
      }
    } else {
      if (designationId) {
        checkList = await CheckList.findAll({
          raw: true,
          where: {
            designationId: designationId,
            status: ['0', '1'],
          },
          include: [
            {
              model: Designation,
              attributes: ['designationName'],
              include: [{ model: companyMaster, attributes: ['companyName'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = checkList.length;
      } else if (companyMasterID) {
        const companyid = [];
        companyid.push(parseInt(companyMasterID));
        let get_one_data = await companyMaster.findAll({
          where: { parentCompanyMasterID: companyMasterID, status: [0, 1] },
        });
        for (var i = 0; i < get_one_data.length; i++) {
          companyid.push(get_one_data[i].companyMasterID);
        }

        checkList = await CheckList.findAll({
          raw: true,
          where: {
            '$designation.companyMaster.companyMasterID$': companyid,
            status: ['0', '1'],
          },
          include: [
            {
              model: Designation,
              attributes: ['designationName'],
              include: [{ model: companyMaster, attributes: ['companyName'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = checkList.length;
      }
    }

    res
      .status(200)
      .json({ status: 200, data: checkList, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getCheckListById = async (req, res, next) => {
  try {
    let get_one_data = await CheckList.findOne({
      where: {
        checkListID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: Designation,
          attributes: ['designationName'],
          include: [{ model: companyMaster, attributes: ['companyName'] }],
        },
      ],
      raw: true,
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateCheckList = async (req, res, next) => {
  try {
    let {
      checkListID,
      checkListName,
      pastdays,
      designationId,
      updateBy,
      updateByIp,
    } = await req.body;

    const companyData = await Designation.findOne({
      where: {
        designationId: designationId,
      },
      raw: true,
    });

    const UniqueData = await executeQuery(
      `SELECT * from "checklists" where LOWER(TRIM("checkListName"))='` +
        checkListName.trim().toLowerCase() +
        `' and "designationId" in (SELECT "designationId" from "designations" where "companyMasterID"=` +
        companyData.companyMasterID +
        `) and "checkListID" !=` +
        checkListID
    );

    if (UniqueData.length > 0) {
      return res.status(200).send({
        status: 401,
        message: 'Checklist with same name already exist',
      });
    }

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await CheckList.update(
        {
          checkListName,
          pastdays,
          designationId,
          updateBy,
          updateByIp,
        },
        {
          where: { checkListID: checkListID },
          transaction: t,
        }
      );

      return res
        .status(200)
        .json({ status: 200, message: 'CheckList updated successfully' });
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { checkListID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (Number(status) == 0 || Number(status) == 2) {
        let get_one_data = await UserChecklist.findOne({
          where: {
            checkListID: checkListID,
            status: 1,
          },
          raw: true,
        });

        if (get_one_data) {
          return res.status(200).json({
            status: 401,
            message: '',
          });
        }
      }

      delete_status = await CheckList.update(
        {
          status: Number(status),
        },
        {
          where: { checkListID: checkListID },
          transaction: t,
        }
      );

      let msg;
      if (Number(status) == 2) {
        msg = 'Checklist deleted Successfully';
      } else {
        msg = 'Checklist status changed Successfully';
      }

      return res.status(200).json({
        status: 200,
        message: msg,
        data: {},
      });
    });
  } catch (err) {
    next(err);
  }
};
