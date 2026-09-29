const Sequelize = require('sequelize');
const CheckListQuestion = require('../models/checkListQuestion');
const CheckList = require('../models/checklist');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const StateMaster = require('../models/statemaster');
const fs = require('fs');
const Designation = require('../models/designation');
const companyMaster = require('../models/companyMaster');
const UserChecklist = require('../models/userCheckList');

exports.postAddCheckListQuestion = async (req, res, next) => {
  try {
    let { checkListID, checklistQuestion, createBy, createByIp } =
      await req.body;

    let result = await sequelize.transaction(async (t) => {
      for (var i = 0; i < checklistQuestion.length; i++) {
        let insert_db_status = await CheckListQuestion.create(
          {
            checkListID,
            checkListQuestion: checklistQuestion[i],
            createBy,
            createByIp,
          },
          { transaction: t }
        );
      }

      return res.status(200).json({
        status: 200,
        message: 'CheckList Questions Added Successfully',
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllCheckListQuestion = async (req, res, next) => {
  try {
    let {
      limit,
      page,
      searchQuery,
      companyMasterID,
      designationId,
      checkListID,
    } = await req.body;
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

        checkList = await CheckListQuestion.findAll({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              {
                checkListQuestion: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$checklist.checkListName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$checklist.designation.designationName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$checklist.designation.companyMaster.companyName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            status: ['0', '1'],
            '$checklist.designation.companyMaster.companyMasterID$': companyid,
          },
          limit: limit,
          offset: offset,
          include: [
            {
              model: CheckList,
              attributes: ['checkListName', 'designationId'],
              include: [
                {
                  model: Designation,
                  attributes: ['designationName'],
                  include: [
                    { model: companyMaster, attributes: ['companyName'] },
                  ],
                },
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = await CheckListQuestion.count({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              {
                checkListQuestion: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$checklist.checkListName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$checklist.designation.designationName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$checklist.designation.companyMaster.companyName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            status: ['0', '1'],
            '$checklist.designation.companyMaster.companyMasterID$': companyid,
          },
          include: [
            {
              model: CheckList,
              attributes: ['checkListName', 'designationId'],
              include: [
                {
                  model: Designation,
                  attributes: ['designationName'],
                  include: [
                    { model: companyMaster, attributes: ['companyName'] },
                  ],
                },
              ],
            },
          ],
        });
      } else if (checkListID) {
        checkList = await CheckListQuestion.findAll({
          raw: true,
          where: {
            checkListID: checkListID,
            status: ['0', '1'],
          },
          limit: limit,
          offset: offset,
          include: [
            {
              model: CheckList,
              attributes: ['checkListName', 'designationId'],
              include: [
                {
                  model: Designation,
                  attributes: ['designationName'],
                  include: [
                    { model: companyMaster, attributes: ['companyName'] },
                  ],
                },
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = await CheckListQuestion.count({
          raw: true,
          where: {
            checkListID: checkListID,
            status: ['0', '1'],
          },
        });
      } else if (designationId) {
        checkList = await CheckListQuestion.findAll({
          raw: true,
          where: {
            '$checklist.designationId$': designationId,
            status: ['0', '1'],
          },
          limit: limit,
          offset: offset,
          include: [
            {
              model: CheckList,
              attributes: ['checkListName', 'designationId'],
              include: [
                {
                  model: Designation,
                  attributes: ['designationName'],
                  include: [
                    { model: companyMaster, attributes: ['companyName'] },
                  ],
                },
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = await CheckListQuestion.count({
          raw: true,
          where: {
            '$checklist.designationId$': designationId,
            status: ['0', '1'],
          },
          include: [
            {
              model: CheckList,
              attributes: ['checkListName', 'designationId'],
              include: [
                {
                  model: Designation,
                  attributes: ['designationName'],
                  include: [
                    { model: companyMaster, attributes: ['companyName'] },
                  ],
                },
              ],
            },
          ],
        });
      } else if (companyMasterID) {
        checkList = await CheckListQuestion.findAll({
          raw: true,
          where: {
            '$checklist.designation.companyMaster.companyMasterID$':
              companyMasterID,
            status: ['0', '1'],
          },
          limit: limit,
          offset: offset,
          include: [
            {
              model: CheckList,
              attributes: ['checkListName', 'designationId'],
              include: [
                {
                  model: Designation,
                  attributes: ['designationName'],
                  include: [
                    { model: companyMaster, attributes: ['companyName'] },
                  ],
                },
              ],
            },
          ],
          order: [['createdAt', 'DESC']],
        });

        totalcount = await CheckListQuestion.count({
          raw: true,
          where: {
            '$checklist.designation.companyMaster.companyMasterID$':
              companyMasterID,
            status: ['0', '1'],
          },
          include: [
            {
              model: CheckList,
              attributes: ['checkListName', 'designationId'],
              include: [
                {
                  model: Designation,
                  attributes: ['designationName'],
                  include: [
                    { model: companyMaster, attributes: ['companyName'] },
                  ],
                },
              ],
            },
          ],
        });
      }
    }

    res
      .status(200)
      .json({ status: 200, data: checkList, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getCheckListQuestionById = async (req, res, next) => {
  try {
    let get_one_data = await CheckListQuestion.findOne({
      where: {
        checkListQuestionID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
      include: [
        {
          model: CheckList,
          attributes: ['checkListID'],
          include: [
            {
              model: Designation,
              attributes: ['designationId', 'companyMasterID'],
            },
          ],
        },
      ],
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

exports.postUpdateCheckListQuestion = async (req, res, next) => {
  try {
    let {
      checkListQuestionID,
      checklistQuestion,
      checkListID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await CheckListQuestion.update(
        {
          checkListQuestion: checklistQuestion,
          checkListID,
          updateBy,
          updateByIp,
        },
        {
          where: { checkListQuestionID: checkListQuestionID },
          transaction: t,
        }
      );

      return res.status(200).json({
        status: 200,
        message: 'CheckList Questions updated successfully',
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschangeCheckListQuestion = async (req, res, next) => {
  try {
    let { checkListQuestionID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (Number(status) == 0 || Number(status) == 2) {
        let get_one_data = await UserChecklist.findOne({
          where: {
            filledChecklistQID: {
              [Sequelize.Op.contains]: [checkListQuestionID],
            },
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

      delete_status = await CheckListQuestion.update(
        {
          status: status,
        },
        {
          where: { checkListQuestionID: checkListQuestionID },
          transaction: t,
        }
      );

      let msg;
      if (Number(status) == 2) {
        msg = 'Checklist Question deleted Successfully';
      } else {
        msg = 'Checklist Question status changed Successfully';
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

exports.getCheckListQuestionByuserId = async (req, res, next) => {
  try {
    let get_one_checkList = await CheckList.findOne({
      where: {
        checkListID: req.params.id,
      },
      raw: true,
    });
    let date = new Date();
    date.setDate(date.getDate() - get_one_checkList.pastdays);
    date = date.toISOString().slice(0, 10);

    let get_one_data = await CheckListQuestion.findAll({
      where: {
        checkListID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else
      res.status(200).json({
        status: 200,
        data: get_one_data,
        date: date,
        presentDate: new Date().toISOString().slice(0, 10),
      });
  } catch (err) {
    next(err);
  }
};
