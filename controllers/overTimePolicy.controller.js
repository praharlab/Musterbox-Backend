const overTimePolicy = require('../models/overTimePolicy');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');

exports.postAddOverTimePolicy = async (req, res, next) => {
  try {
    let = {
      companyMasterID,
      overtimePolicyName,
      overtimeSkipMin,
      afterOvertimeCalculationHour,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let db_status = await overTimePolicy.create(
        {
          companyMasterID,
          overtimePolicyName,
          overtimeSkipMin,
          afterOvertimeCalculationHour,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        data: db_status,
        message: message.usermessage.overTimePolicyAdd,
      });
      return db_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.postViewOverTimePolicy = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    const companyid = [];
    companyid.push(parseInt(req.body.companyMasterID));
    let get_one_data = await companyMasters.findAll({
      where: {
        parentCompanyMasterID: req.body.companyMasterID,
        status: [0, 1],
      },
      include: [{ all: true, nested: true }],
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    if (limit == '' && page == '') {
      overTimePolicy_data = await overTimePolicy.findAll({
        raw: true,
        include: [{ all: true, nested: true }],
        where: {
          status: 1,
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
        },
      });
    } else {
      overTimePolicy_data = await overTimePolicy.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
        },
        include: [{ all: true, nested: true }],
        limit: limit,
        offset: offset,
      });
    }
    const totalcount = await overTimePolicy.count({
      raw: true,
      where: {
        status: ['0', '1'],
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
      },
    });

    res
      .status(200)
      .json({ status: 200, data: overTimePolicy_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateOverTimePolicy = async (req, res, next) => {
  try {
    let = {
      overTimePolicyID,
      companyMasterID,
      overtimePolicyName,
      overtimeSkipMin,
      afterOvertimeCalculationHour,
      createBy,
      createByIp,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let data = await overTimePolicy.update(
        {
          companyMasterID,
          overtimePolicyName,
          overtimeSkipMin,
          afterOvertimeCalculationHour,
          createBy,
          createByIp,
          updateBy,
          updateByIp,
        },
        {
          where: {
            overTimePolicyID: overTimePolicyID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.overTimePolicyUpdate,
      });
      return data;
    });
  } catch (err) {
    next(err);
  }
};

exports.getOverTimePolicyById = async (req, res, next) => {
  try {
    var data = await overTimePolicy.findOne({
      raw: true,
      where: {
        overTimePolicyID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    if (!data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: data });
    }
  } catch (err) {
    next(err);
  }
};

exports.postDeleteOverTimePolicyById = async (req, res, next) => {
  try {
    let result = await sequelize.transaction(async (t) => {
      var id = req.params.id;
      let delete_status = await overTimePolicy.update(
        {
          status: 2,
        },
        {
          where: { overTimePolicyID: id },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.overTimePolicyDelete,
      });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.postChangeStatus = async (req, res, next) => {
  try {
    let = { overTimePolicyID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await overTimePolicy.update(
          {
            status: '1',
          },
          {
            where: { overTimePolicyID: overTimePolicyID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await overTimePolicy.update(
          {
            status: '0',
          },
          {
            where: { overTimePolicyID: overTimePolicyID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }
      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.overTimePolicyStatus,
        });
      } else {
        res
          .status(200)
          .json({ status: 200, message: message.usermessage.deletedrecord });
      }
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};
