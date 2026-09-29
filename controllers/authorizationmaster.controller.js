const Sequelize = require('sequelize');
const AuthorizationMaster = require('../models/authorizationMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const AuthorizationDetails = require('../models/AuthorizationDetails');
/**
 * save authorizationMaster data.
 *
 * @body {createBy} createBy user id of user who added the authorizationMaster.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddAuthorizationMaster = async (req, res, next) => {
  try {
    let = { authorizationMasterName, createByIp } = await req.body;

    const existingAuthorizationType = await AuthorizationMaster.findOne({
      where: {
        authorizationMasterName,
        status: ['0', '1'],
      },
    });

    if (existingAuthorizationType) {
      return res.status(200).json({
        status: 401,
        message: 'Authorization type already exists.',
      });
    }

    let insert_db_status = await AuthorizationMaster.create({
      authorizationMasterName,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Authorization'),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all authorizationMaster data
 */

exports.getAllAuthorizationMasterData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: { [Sequelize.Op.in]: [0, 1] },
    };

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          authorizationMasterName: { [Sequelize.Op.iLike]: `%${searchQuery}%` },
        },
      ];
    }

    const { rows, count } = await AuthorizationMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['authorizationMasterName', 'ASC']],
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
 * find data with authorizationMaster id
 *
 * @param {id} authorizationMasterID  to fetch authorizationMaster name
 */

exports.getAuthorizationMasterById = async (req, res, next) => {
  try {
    let get_one_data = await AuthorizationMaster.findOne({
      where: {
        authorizationMasterID: req.params.id,
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
 * @param {id} authorizationMasterID  to update id
 */
exports.postUpdateAuthorizationMaster = async (req, res, next) => {
  try {
    let { authorizationMasterID, authorizationMasterName, updateByIp } =
      await req.body;

    const existingAuthorizationType = await AuthorizationMaster.findOne({
      where: {
        authorizationMasterName,
        authorizationMasterID: {
          [Sequelize.Op.ne]: authorizationMasterID,
        },
        status: ['0', '1'],
      },
    });

    if (existingAuthorizationType) {
      return res.status(200).json({
        status: 401,
        message: 'Authorization type already exists.',
      });
    }

    await AuthorizationMaster.update(
      {
        authorizationMasterName,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { authorizationMasterID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.authorizationMasterupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} authorizationMasterID  to update status of authorizationMaster
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { authorizationMasterID, status } = await req.body;

    if (status != '1') {
      let data = await AuthorizationDetails.findOne({
        where: {
          AuthorizationMasterID: authorizationMasterID,
          status: ['0', '1'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Authorization Master.Already assigned to employees.',
        });
      }
    }
    await AuthorizationMaster.update(
      {
        status,
      },
      {
        where: {
          authorizationMasterID,
        },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Authorization')
          : message.usermessage.deactiveMessage('Authorization'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} authorizationMasterID  to delete id
 */
exports.postDeleteAuthorizationMasterById = async (req, res, next) => {
  try {
    let { authorizationMasterID } = await req.body;

    let data = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterID,
        status: ['0', '1'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Authorization Master.Already assigned to employees.',
      });
    } else {
      await AuthorizationMaster.update(
        {
          status: 2,
        },
        {
          where: { authorizationMasterID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Authorization'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getActiveAuthorizationMasterData = async (req, res, next) => {
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
        {
          authorizationMasterName: { [Sequelize.Op.iLike]: `%${searchQuery}%` },
        },
      ];
    }

    const { rows, count } = await AuthorizationMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['authorizationMasterName', 'ASC']],
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
