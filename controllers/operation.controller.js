const Sequelize = require('sequelize');
const OperationMaster = require('../models/operation');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const formMaster = require('../models/formMaster');
/**
 * save operation data.
 *
 * @body {createBy} createBy user id of user who added the operation.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddOperation = async (req, res, next) => {
  try {
    const { operationName, createByIp } = await req.body;

    const existingOperationType = await OperationMaster.findOne({
      where: {
        operationName,
        status: ['0', '1'],
      },
    });

    if (existingOperationType) {
      return res.status(200).json({
        status: 401,
        message: ' Operation type already exists.',
      });
    }

    let insert_db_status = await OperationMaster.create({
      operationName,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Operation'),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all operation data
 */

exports.getAllOperationData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = req.body;

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
        { operationName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];
    }

    const { rows, count } = await OperationMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
      order: [['operationID', 'ASC']],
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
 * find data with operationMaster id
 *
 * @param {id} operationID  to fetch operation name
 */

exports.getOperationById = async (req, res, next) => {
  try {
    let get_one_data = await OperationMaster.findOne({
      where: {
        operationID: req.params.id,
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
 * @param {id} operationID  to update id
 */
exports.postUpdateOperation = async (req, res, next) => {
  try {
    const { operationID, operationName, updateByIp } = await req.body;

    const existingOperationType = await OperationMaster.findOne({
      where: {
        operationName,
        operationID: {
          [Sequelize.Op.ne]: operationID,
        },
        status: ['0', '1'],
      },
    });

    if (existingOperationType) {
      return res.status(200).json({
        status: 401,
        message: ' Operation type already exists.',
      });
    }

    await OperationMaster.update(
      {
        operationName,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { operationID: operationID },
      }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.updateMessage('Operation'),
      });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} operationID  to update status of operation
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    const { operationID, status } = await req.body;

    if (status != '1') {
      let data = await formMaster.findOne({
        where: {
          operation: {
            [Sequelize.Op.contains]: [operationID],
          },
          status: ['1', '0'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this operation.Already used in Forms.',
        });
      }
    }

    await OperationMaster.update(
      {
        status,
      },
      {
        where: { operationID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Operation')
          : message.usermessage.deactiveMessage('Operation'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} operationID  to delete id
 */
exports.postDeleteOperationById = async (req, res, next) => {
  try {
    const { operationID } = await req.body;

    let data = await formMaster.findOne({
      where: {
        operation: {
          [Sequelize.Op.contains]: [operationID],
        },
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message: 'You can not delete this operation.Already used in Forms.',
      });
    } else {
      await OperationMaster.update(
        {
          status: 2,
        },
        {
          where: { operationID },
        }
      );

      return res
        .status(200)
        .json({
          status: 200,
          message: message.usermessage.deleteMessage('Operation'),
        });
    }
  } catch (err) {
    next(err);
  }
};

exports.getActiveOperationData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = req.body;

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
        { operationName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];
    }

    const { rows, count } = await OperationMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
      order: [['operationID', 'ASC']],
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
