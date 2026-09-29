const Sequelize = require('sequelize');
const ProbationPolicy = require('../models/probationPolicy');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
/**
 * save probationPolicy data.
 *
 * @body {createBy} createBy user id of user who added the probationPolicy.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddProbationPolicy = async (req, res, next) => {
  try {
    let = {
      companyMasterID,
      policyName,
      description,
      periodDuration,
      durationType,
      extendTime,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await ProbationPolicy.create(
        {
          companyMasterID,
          policyName,
          description,
          periodDuration,
          durationType,
          extendTime,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.probationpolicyadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 return all probationPolicy data
 */

exports.getAllProbationPolicyData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let probation_policy = [];
    if (limit == '' && page == '') {
      probation_policy = await ProbationPolicy.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['policyName', 'ASC']],
      });
    } else {
      probation_policy = await ProbationPolicy.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['policyName', 'ASC']],
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await ProbationPolicy.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: probation_policy, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with probationPolicy id
 *
 * @param {id} probationPolicyID  to fetch probationPolicy name
 */

exports.getProbationPolicyById = async (req, res, next) => {
  try {
    let get_one_data = await ProbationPolicy.findOne({
      where: {
        probationPolicyID: req.params.id,
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
    else res.status(200).json({ stauts: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} probationPolicyID  to update id
 */
exports.postUpdateProbationPolicy = async (req, res, next) => {
  try {
    let = {
      probationPolicyID,
      companyMasterID,
      policyName,
      description,
      periodDuration,
      durationType,
      extendTime,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await ProbationPolicy.update(
        {
          companyMasterID,
          policyName,
          description,
          periodDuration,
          durationType,
          extendTime,
          updateBy,
          updateByIp,
        },
        {
          where: { probationPolicyID: probationPolicyID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.probationpolicyupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} probationPolicyID  to update status of probationPolicy
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { probationPolicyID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await ProbationPolicy.update(
          {
            status: '1',
          },
          {
            where: { probationPolicyID: probationPolicyID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await ProbationPolicy.update(
          {
            status: '0',
          },
          {
            where: { probationPolicyID: probationPolicyID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.probationpolicydelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} probationPolicyID  to delete id
 */
exports.postDeleteProbationPolicyById = async (req, res, next) => {
  try {
    let = { probationPolicyID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await ProbationPolicy.update(
        {
          status: 2,
        },
        {
          where: { probationPolicyID: probationPolicyID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.probationpolicydelete,
      });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
