const Sequelize = require('sequelize');
const CostCenter = require('../models/costCenter');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
/**
 * save cost center data.
 *
 * @body {createBy} createBy user id of user who added the cost center.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddCostCenter = async (req, res, next) => {
  try {
    let = {
      costCenterName,
      costCenterCode,
      description,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await CostCenter.create(
        {
          costCenterName,
          costCenterCode,
          description,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.costcenteradd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all cost center data
 */

exports.getAllCostCenterData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let cost_center = [];
    if (limit == '' && page == '') {
      cost_center = await CostCenter.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['costCenterName', 'ASC']],
      });
    } else {
      cost_center = await CostCenter.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['costCenterName', 'ASC']],
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await CostCenter.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: cost_center, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with costCenter id
 *
 * @param {id} costCenterID  to fetch cost center name
 */

exports.getCostCenterById = async (req, res, next) => {
  try {
    let get_one_data = await CostCenter.findOne({
      where: {
        costCenterID: req.params.id,
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
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} costCenterID  to update id
 */
exports.postUpdateCostCenter = async (req, res, next) => {
  try {
    let = {
      costCenterID,
      costCenterName,
      costCenterCode,
      description,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await CostCenter.update(
        {
          costCenterName,
          costCenterCode,
          description,
          updateBy,
          updateByIp,
        },
        {
          where: { costCenterID: costCenterID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.costcenterupdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} costCenterID  to update status of cost center
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { costCenterID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await CostCenter.update(
          {
            status: '1',
          },
          {
            where: { costCenterID: costCenterID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await CostCenter.update(
          {
            status: '0',
          },
          {
            where: { costCenterID: costCenterID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.costcenterdelete,
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
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} costCenterID  to delete id
 */
exports.postDeleteCostCenterById = async (req, res, next) => {
  try {
    let = { costCenterID } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let delete_status = await CostCenter.update(
        {
          status: 2,
        },
        {
          where: { costCenterID: costCenterID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.costcenterdelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};
