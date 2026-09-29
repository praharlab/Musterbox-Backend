const Sequelize = require('sequelize');
const BankMaster = require('../models/bankMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const employeeJoiningDetails = require('../models/employeeJoiningDetails');
const { getAutomticShiftAssigned } = require('../utils/commonUtilFunctions');
const HrLeaveMaster = require('../models/hrLeaveMaster');
/**
 * save bank data.
 *
 * @body {createBy} createBy user id of user who added the bank.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddBank = async (req, res, next) => {
  try {
    const { bankName, createByIp } = await req.body;

    const existingBank = await BankMaster.findOne({
      where: {
        bankName,
        status: ['0', '1'],
      },
    });

    if (existingBank) {
      return res.status(200).json({
        status: 401,
        message: 'Bank name already exists.',
      });
    }

    let insert_db_status = await BankMaster.create({
      bankName,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Bank'),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

exports.testUtil = async (req, res, next) => {
  try {
    let data = await getAutomticShiftAssigned(3150, new Date());

    res.status(200).json({
      status: 200,
      message: '',
      data: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all bank data
 */

exports.getAllBankData = async (req, res, next) => {
  try {
    const { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: ['1', '0'],
    };
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { bankName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await BankMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all Active  bank data
 */
exports.getActiveBankData = async (req, res, next) => {
  try {
    const { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: 1,
    };
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { bankName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await BankMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with bankMaster id
 *
 * @param {id} bankMasterID  to fetch bank name
 */

exports.getBankById = async (req, res, next) => {
  try {
    let get_one_data = await BankMaster.findOne({
      where: {
        bankMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} bankMasterID  to update id
 */
exports.postUpdateBank = async (req, res, next) => {
  try {
    let { bankMasterID, bankName, updateByIp } = await req.body;

    const existingBank = await BankMaster.findOne({
      where: {
        bankName,
        bankMasterID: {
          [Sequelize.Op.ne]: bankMasterID,
        },
        status: ['0', '1'],
      },
    });

    if (existingBank) {
      return res.status(200).json({
        status: 401,
        message: 'Bank name already exists.',
      });
    }

    await BankMaster.update(
      {
        bankName,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { bankMasterID },
      }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.updateMessage('Bank'),
      });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} bankMasterID  to update status of bank
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { bankMasterID, status } = await req.body;

    if (status != '1') {
      let data = await employeeJoiningDetails.findOne({
        where: {
          bankMasterID,
          status: ['0', '1'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Bank.Already assigned to employees',
        });
      }
    }

    await BankMaster.update(
      {
        status,
      },
      {
        where: { bankMasterID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Bank')
          : message.usermessage.deactiveMessage('Bank'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} bankMasterID  to delete id
 */
exports.postDeleteBankById = async (req, res, next) => {
  try {
    let { bankMasterID } = await req.body;

    let data = await employeeJoiningDetails.findOne({
      where: {
        bankMasterID,
        status: ['0', '1'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message: 'You can not delete this Bank.Already assigned to employees',
      });
    } else {
      let delete_status = await BankMaster.update(
        {
          status: 2,
        },
        {
          where: { bankMasterID },
        }
      );

      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.bankdelete });
    }
  } catch (err) {
    next(err);
  }
};
