const Sequelize = require('sequelize');
const payheadMaster = require('../models/payhead');
const logger = require('../config/logger');
const message = require('../response_message/message');
const fs = require('fs');
const HrsalaryField = require('../models/hrSalaryFields');
const path = require('path');
/**
 * save payhead data.
 *
 * @body {createBy} createBy user id of user who added the payhead.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddPayhead = async (req, res, next) => {
  try {
    const { payheadName, payheadDesc, createByIp, taxApplicability } = await req.body;

    const existingPayheadType = await payheadMaster.findOne({
      where: {
        payheadName,
        status: ['0', '1'],
      },
    });

    if (existingPayheadType) {
      return res.status(200).json({
        status: 401,
        message: 'Payhead type already exists.',
      });
    }

    let insert_db_status = await payheadMaster.create({
      payheadName,
      payheadDesc,
      taxApplicability,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Payhead'),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all payhead data
 */

exports.getAllPayhead = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: [0, 1],
    };

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { payheadName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];
    }

    const { rows, count } = await payheadMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with PayheadMaster id
 *
 * @param {id} PayheadMasterID  to fetch Payhead name
 */

exports.getPayheadById = async (req, res, next) => {
  try {
    let get_one_data = await payheadMaster.findOne({
      where: {
        payheadMasterId: req.params.id,
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
 * @param {id} payheadMasterID  to update id
 */
exports.postUpdatePayhead = async (req, res, next) => {
  try {
    const { payheadMasterID, payheadName, payheadDesc, status, updateByIp, taxApplicability } =
      await req.body;

    const existingPayheadType = await payheadMaster.findOne({
      where: {
        payheadName,
        payheadMasterId: {
          [Sequelize.Op.ne]: payheadMasterID,
        },
        status: ['0', '1'],
      },
    });

    if (existingPayheadType) {
      return res.status(200).json({
        status: 401,
        message: 'payhead already exists.',
      });
    }

    await payheadMaster.update(
      {
        payheadName,
        payheadDesc,
        status,
        taxApplicability,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { payheadMasterId: payheadMasterID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Payhead'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} payheadMasterID  to update status of Payhead
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { payheadMasterID, status } = await req.body;

    if (status != '1') {
      let data = await HrsalaryField.findOne({
        where: {
          payheadMasterId: payheadMasterID,
          status: ['0', '1'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Salary Field.Already used in companies.',
        });
      }
    }

    payheadMaster.update(
      {
        status,
      },
      {
        where: { payheadMasterId: payheadMasterID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Payhead')
          : message.usermessage.deactiveMessage('Payhead'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
/**
 * delete by i
 *
 * @param {id} payheadMasterID  to delete id
 */
exports.postDeletePayheadById = async (req, res, next) => {
  try {
    let { payheadMasterID } = await req.body;

    let data = await HrsalaryField.findOne({
      where: {
        payheadMasterId: payheadMasterID,
        status: ['0', '1'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Salary Field.Already used in companies.',
      });
    } else {
      payheadMaster.update(
        {
          status: 2,
        },
        {
          where: { payheadMasterId: payheadMasterID },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('payhead'),
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * import Payhead data
 * @param {file}
 */
exports.postImportData = async (req, res, next) => {
  try {
    const file = req.file;
    let { createBy, createByIp } = req.body;

    if (!file) {
      const error = new Error('No File');
      error.httpStatusCode = 400;

      return next(error);
    } else {
      const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

      fs.readFile(filePath, async (err, data) => {
        if (err) throw err;

        const payheadData = JSON.parse(data);

        await payheadMaster.bulkCreate(payheadData, {
          returning: true,
        });

        res.json({ success: 200, message: 'data inserted' });
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getActivePayhead = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: 1,
    };

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { payheadName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];
    }

    const { rows, count } = await payheadMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
