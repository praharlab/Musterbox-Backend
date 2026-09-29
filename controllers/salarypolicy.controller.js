const Sequelize = require('sequelize');
const SalaryPolicyMaster = require('../models/salaryPolicy');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMasters = require('../models/companyMaster');
const employeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const UserMaster = require('../models/userMaster');
const { userAttributes } = require('../utils/commonVars');
/**
 * save SalaryPolicy data.
 *
 * @body {createBy} createBy user id of user who added the SalaryPolicy.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddSalaryPolicy = async (req, res, next) => {
  try {
    let {
      salaryPolicyName,
      salaryCycleDate,
      salaryCalculationDays,
      salarycalculationBasedon,
      monthlyFixhours,
      dailyFixhours,
      holidayHours,
      weekoffHours,
      leaveHours,
      breakHours,
      overtimeAdded,
      salaryCycleConsider,
      companyMasterID,
      considerTimeType,
      considerTimeValue,
      createBy,
      createByIp,
    } = await req.body;

    console.log(req.body, 'req.body');

    if (salarycalculationBasedon != 'hourwise') {
      considerTimeType = null;
      considerTimeValue = null;
    }

    await sequelize.transaction(async (t) => {
      await SalaryPolicyMaster.create(
        {
          salaryPolicyName,
          salaryCycleDate,
          companyMasterID,
          salaryCalculationDays,
          salarycalculationBasedon,
          monthlyFixhours,
          dailyFixhours,
          holidayHours,
          weekoffHours,
          leaveHours,
          breakHours,
          overtimeAdded,
          salaryCycleConsider,
          considerTimeType,
          considerTimeValue:
            considerTimeType == 'actual' ? null : considerTimeValue,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.salarypolicyadd,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all SalaryPolicy data
 */

exports.getAllSalaryPolicyData = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery } = await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          salaryPolicyName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const salaryPolicy = await SalaryPolicyMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasters,
          attributes: ['companyName'],
        },
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'updatedByUserDetails',
          attributes: userAttributes,
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: salaryPolicy.rows,
      totalcount: salaryPolicy.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with SalaryPolicy id
 *
 * @param {id} salaryPolicyID  to fetch SalaryPolicy name
 */

exports.getSalaryPolicyById = async (req, res, next) => {
  try {
    let get_one_data = await SalaryPolicyMaster.findOne({
      where: {
        salaryPolicyID: req.params.id,
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
    res.status(200).json({ status: 200, data: get_one_data });
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
 * @param {id} salaryPolicyID  to update id
 */
exports.postUpdateSalaryPolicy = async (req, res, next) => {
  try {
    let {
      salaryPolicyID,
      salaryPolicyName,
      companyMasterID,
      salaryCycleDate,
      salaryCalculationDays,
      salarycalculationBasedon,
      monthlyFixhours,
      dailyFixhours,
      holidayHours,
      weekoffHours,
      leaveHours,
      breakHours,
      overtimeAdded,
      salaryCycleConsider,
      considerTimeType,
      considerTimeValue,
      updateBy,
      updateByIp,
    } = await req.body;

    if (salarycalculationBasedon != 'hourwise') {
      considerTimeType = null;
      considerTimeValue = null;
    }

    await sequelize.transaction(async (t) => {
      await SalaryPolicyMaster.update(
        {
          salaryPolicyName,
          salaryCycleDate,
          companyMasterID,
          salaryCalculationDays,
          salarycalculationBasedon,
          monthlyFixhours,
          dailyFixhours,
          holidayHours,
          weekoffHours,
          leaveHours,
          breakHours,
          overtimeAdded,
          salaryCycleConsider,
          considerTimeType,
          considerTimeValue:
            considerTimeType == 'actual' ? null : considerTimeValue,
          updateBy,
          updateByIp,
        },
        {
          where: { salaryPolicyID: salaryPolicyID },
          transaction: t,
        }
      );
    });

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.salarypolicyupdate });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} salaryPolicyID  to update status of SalaryPolicy
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { salaryPolicyID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await SalaryPolicyMaster.update(
          {
            status: '1',
          },
          {
            where: { salaryPolicyID: salaryPolicyID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await employeeSalaryPolicy.findOne({
          where: {
            salaryPolicyID: salaryPolicyID,
            status: ['1', '0'],
          },
        });

        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactive this Salary Policy. Already assigned to employees.',
          });
        } else {
          delete_status = await SalaryPolicyMaster.update(
            {
              status: '0',
            },
            {
              where: { salaryPolicyID: salaryPolicyID, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.bankdelete,
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
 * @param {id} salaryPolicyID  to delete id
 */
exports.postDeleteSalaryPolicyById = async (req, res, next) => {
  try {
    let { salaryPolicyID } = await req.body;
    // let delete_db_status = await SalaryPolicyMaster.destroy({
    //     where: {
    //         salaryPolicyID: salaryPolicyID
    //     }
    // });

    let data = await employeeSalaryPolicy.findOne({
      where: {
        salaryPolicyID: salaryPolicyID,
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Salary Policy. Already assigned to employees.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await SalaryPolicyMaster.update(
          {
            status: 2,
          },
          {
            where: { salaryPolicyID: salaryPolicyID },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.salarypolicydelete,
        });
        return delete_status;
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getactivesalarybycompanyid = async (req, res, next) => {
  try {
    let salary;
    salary = await SalaryPolicyMaster.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
    });

    res.status(200).json({ status: 200, data: salary });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    } else {
      next(err);
    }
  }
};
