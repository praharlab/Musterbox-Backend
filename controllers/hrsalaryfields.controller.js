const Sequelize = require('sequelize');
const HRSalaryFields = require('../models/hrSalaryFields');
const companyMaster = require('../models/companyMaster');
const payheadMaster = require('../models/payhead');
const UserMaster = require('../models/userMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const HRSalaryFieldChild = require('../models/hrSalaryFieldChild');
const e = require('express');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const { generateExcel } = require('../utils/exportData');
const Payheadmaster = require('../models/payhead');
const { default_payheadMasterIds } = require('../utils/dbUtils');

/**
 * save hr salary fields data.
 *
 * @body {createBy} createBy user id of user who added the hr salary field.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddHRSalaryFields = async (req, res, next) => {
  try {
    const {
      payheadMasterId,
      salaryFieldIndex,
      salaryFieldSide,
      salaryFieldAttanChk,
      salaryFieldMaxAmt,
      salaryFieldWhen,
      salaryFieldWhenMonth,
      salaryFieldDefaultPer,
      salaryFieldRound,
      salaryFieldRoundNo,
      salaryFieldSrNo,
      salaryFieldShow,
      formula,
      formulaID,
      salaryFieldMaxRange,
      companyMasterID,
      payheadDisplayName,
      roundOffType,
      considerIn,
      createBy,
      createByIp,
    } = await req.body;

    const uniquedata = await HRSalaryFields.findOne({
      where: {
        payheadMasterId,
        companyMasterID,
        status: 1,
      },
    });

    if (uniquedata)
      return res
        .status(200)
        .json({ status: 401, message: 'Payhead already exist.' });

    // Only for LWP deduction payhead

    if (
      payheadMasterId == 99 &&
      (salaryFieldSrNo != 'B' ||
        salaryFieldSide != 'D' ||
        salaryFieldShow != 'Y')
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Invalid salary field configuration for LWP Deduction',
      });
    }

    await sequelize.transaction(async (t) => {
      await HRSalaryFields.create(
        {
          payheadMasterId,
          salaryFieldIndex,
          salaryFieldSide,
          salaryFieldAttanChk,
          salaryFieldMaxAmt,
          salaryFieldWhen,
          salaryFieldWhenMonth,
          salaryFieldDefaultPer,
          salaryFieldRound,
          salaryFieldRoundNo,
          salaryFieldSrNo,
          salaryFieldShow,
          formula,
          formulaID,
          roundOffType,
          salaryFieldMaxRange,
          companyMasterID,
          payheadDisplayName,
          considerIn:
            salaryFieldSrNo == 'A' && salaryFieldShow == 'Y'
              ? considerIn
              : null,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.hrsalaryfieldsadd,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return getAllHRSalaryFieldsData
 */
exports.getAllHRSalaryFieldsData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let hr_salary_fields = [];
    if (limit == '' && page == '') {
      hr_salary_fields = await HRSalaryFields.findAll({
        include: [{ all: true, nested: true }],
        order: [['createdAt', 'ASC']],
        where: {
          status: [0, 1],
        },
      });
    } else {
      hr_salary_fields = await HRSalaryFields.findAll({
        include: [{ all: true, nested: true }],
        where: {
          status: [0, 1],
        },
        limit: limit,
        offset: offset,
        order: [['createdAt', 'ASC']],
      });
    }

    const totalcount = await HRSalaryFields.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: hr_salary_fields, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with bankMaster id
 *
 * @param {id} salaryFieldID  to fetch bank name
 */

exports.getHRSalaryFieldsById = async (req, res, next) => {
  try {
    let get_one_data = await HRSalaryFields.findOne({
      where: {
        salaryFieldID: req.params.id,
        status: [0, 1],
      },
      include: [{ all: true, nested: true }],
    });
    let getChild = await HRSalaryFieldChild.findAll({
      where: {
        salaryFieldID: req.params.id,
      },
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res
        .status(200)
        .json({ status: 200, data: get_one_data, childData: getChild });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} salaryFieldID  to update id
 */
exports.postUpdateHRSalaryFields = async (req, res, next) => {
  try {
    const {
      salaryFieldID,
      payheadMasterId,
      salaryFieldIndex,
      salaryFieldSide,
      salaryFieldAttanChk,
      salaryFieldMaxAmt,
      salaryFieldWhen,
      salaryFieldWhenMonth,
      salaryFieldDefaultPer,
      salaryFieldRound,
      salaryFieldRoundNo,
      salaryFieldSrNo,
      salaryFieldShow,
      salaryFieldMaxRange,
      companyMasterID,
      payheadDisplayName,
      roundOffType,
      updateBy,
      updateByIp,
      formula,
      formulaID,
      considerIn,
    } = await req.body;

    const uniquedata = await HRSalaryFields.findOne({
      where: {
        payheadMasterId: payheadMasterId,
        companyMasterID: companyMasterID,
        salaryFieldID: { [Sequelize.Op.notIn]: [salaryFieldID] },
        status: 1,
      },
    });

    if (uniquedata)
      return res
        .status(200)
        .json({ status: 401, message: 'Payhead already exist.' });

    // Only for LWP deduction payhead

    if (
      payheadMasterId == 99 &&
      (salaryFieldSrNo != 'B' ||
        salaryFieldSide != 'D' ||
        salaryFieldShow != 'Y')
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Invalid salary field configuration for LWP Deduction',
      });
    }

    await sequelize.transaction(async (t) => {
      await HRSalaryFields.update(
        {
          payheadMasterId,
          salaryFieldIndex,
          salaryFieldSide,
          salaryFieldAttanChk,
          salaryFieldMaxAmt,
          salaryFieldWhen,
          salaryFieldWhenMonth,
          salaryFieldDefaultPer,
          salaryFieldRound,
          salaryFieldRoundNo,
          salaryFieldSrNo,
          salaryFieldShow,
          salaryFieldMaxRange,
          companyMasterID,
          payheadDisplayName,
          roundOffType,
          considerIn:
            salaryFieldSrNo == 'A' && salaryFieldShow == 'Y'
              ? considerIn
              : null,
          updateBy,
          updateByIp,
          formula,
          formulaID,
        },
        {
          where: { salaryFieldID: salaryFieldID },
          transaction: t,
        }
      );
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.hrsalaryfieldsupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} salaryFieldID  to update status of bank
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    const { salaryFieldID, status } = await req.body;

    const findSalaryField = await HRSalaryFields.findOne({
      where: {
        salaryFieldID,
      },
      attributes: ['salaryFieldID', 'payheadMasterId'],
    });

    if (!findSalaryField) throw new Error('HR Salary Field does not exist!');

    if (status == 0) {
      const data = await GradeSalaryStructure.count({
        where: {
          salaryFieldID: salaryFieldID,
        },
      });

      if (data > 0 && findSalaryField.payheadMasterId != 99) {
        return res.status(200).json({
          status: 401,
          message:
            "You have already used this field in salary structure . So, you can't deactive it.",
        });
      }
    }

    await HRSalaryFields.update(
      {
        status,
      },
      {
        where: { salaryFieldID: salaryFieldID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: `HR Salary Field ${status == 0 ? 'deactivate' : 'activate'} successfully!`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by id
 *
 * @param {id} salaryFieldID  to delete id
 */
exports.postDeleteHRSalaryFieldsById = async (req, res, next) => {
  try {
    let { salaryFieldID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let data = await GradeSalaryStructure.count({
        where: {
          salaryFieldID: salaryFieldID,
        },
      });

      if (data > 0) {
        return res.status(200).json({
          status: 401,
          message:
            "You have already used this field in salary structure . So, you can't delete it.",
        });
      } else {
        let delete_status = await HRSalaryFields.update(
          {
            status: 2,
          },
          {
            where: { salaryFieldID: salaryFieldID },
            transaction: t,
          }
        );

        let deletechild = await HRSalaryFieldChild.destroy({
          where: { salaryFieldID: salaryFieldID },
        });

        res.status(200).json({
          status: 200,
          message: message.usermessage.hrsalaryfieldsdelete,
        });
        return delete_status;
      }
    });
  } catch (err) {
    res.status(200).json({ status: 401, message: err.message });
  }
};

exports.postCalculateSalaryField = async (req, res, next) => {
  try {
    let { salaryFieldID } = req.body;
    let get_child = await HRSalaryFieldChild.findOne({
      where: {
        salaryFieldID: salaryFieldID,
        status: [0, 1],
      },
    });

    res
      .status(200)
      .json({ status: 200, message: message.usermessage.hrsalaryfieldsdelete });
  } catch (err) {
    next(err);
  }
};

exports.getActiveHRSalaryFieldsById = async (req, res, next) => {
  try {
    let get_one_data = await HRSalaryFields.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      include: [{ all: true, nested: true }],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getpayheadbycompany = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let hr_salary_fields = [];
    if (limit == '' && page == '') {
      hr_salary_fields = await HRSalaryFields.findAll({
        include: [{ all: true, nested: true }],
        order: [['createdAt', 'ASC']],
        where: {
          status: [0, 1],
          companyMasterID: req.body.companyMasterID,
        },
      });
    } else {
      hr_salary_fields = await HRSalaryFields.findAll({
        include: [{ all: true, nested: true }],
        where: {
          status: [0, 1],
          companyMasterID: req.body.companyMasterID,
        },
        limit: limit,
        offset: offset,
        order: [['createdAt', 'ASC']],
      });
    }

    for (var i = 0; i < hr_salary_fields.length > 0; i++) {
      let data = await HRSalaryFieldChild.findAll({
        include: [{ all: true, nested: true }],
        where: {
          salaryFieldID: hr_salary_fields[i].salaryFieldID,
        },
      });

      hr_salary_fields[i].dataValues.effectedpayhead = data;
    }

    const totalcount = await HRSalaryFields.count({
      raw: true,
      where: { status: ['0', '1'], companyMasterID: req.body.companyMasterID },
    });

    res
      .status(200)
      .json({ status: 200, data: hr_salary_fields, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getbycompanyidforgradedropdown = async (req, res, next) => {
  try {
    let { companyMasterID } = await req.body;

    const { rows: hr_salary_fields, count } =
      await HRSalaryFields.findAndCountAll({
        include: [{ model: Payheadmaster }],
        where: {
          status: 1,
          companyMasterID: companyMasterID,
          '$Payheadmaster.payheadMasterId$': {
            [Sequelize.Op.notIn]: default_payheadMasterIds,
          },
        },
        order: [['createdAt', 'ASC']],
      });

    return res
      .status(200)
      .json({ status: 200, data: hr_salary_fields, totalcount: count });
  } catch (err) {
    next(err);
  }
};

//**
// Get HrSalaryFields By CompanyID
// */

function getMonthNames(monthNumbers) {
  // Array of month names (0-indexed, where 0 = January, 1 = February, ..., 11 = December)
  const months = [
    'All',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Map the month numbers to their corresponding month names
  const monthNames = monthNumbers.map((month) => months[month]);

  // Join the names into a single string with commas
  return monthNames.join(',');
}

exports.getallbycompany = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$Payheadmaster.payheadName$': {
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
    if (page && limit && !exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const hrSalary_Fields = await HRSalaryFields.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: payheadMaster,
          as: 'Payheadmaster',
        },
        {
          model: companyMaster,
          as: 'companyMaster',
        },
      ],
    });

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < hrSalary_Fields.rows.length; i++) {
        const monthNames = getMonthNames(
          hrSalary_Fields.rows[i].salaryFieldWhenMonth
        );
        const data1 = {
          ['Company Name']: hrSalary_Fields.rows[i].companyMaster.companyName,
          ['Payhead']: hrSalary_Fields.rows[i].Payheadmaster.payheadName,
          ['Payhead Display Name']: hrSalary_Fields.rows[i].payheadDisplayName,
          ['Payhead Calculate in Month']: monthNames,
          ['Depends On']:
            hrSalary_Fields.rows[i].salaryFieldAttanChk == 0
              ? 'Fix'
              : hrSalary_Fields.rows[i].salaryFieldAttanChk == 1
                ? 'Paid Days'
                : hrSalary_Fields.rows[i].salaryFieldAttanChk == 2
                  ? 'Physical Attendence'
                  : '',
          ['Salary Field Group']: hrSalary_Fields.rows[i].salaryFieldSrNo,
          ['Payhead Side']:
            hrSalary_Fields.rows[i].salaryFieldSide == 'E'
              ? 'Earning'
              : 'Deduct',
          ['Payhead Show']:
            hrSalary_Fields.rows[i].salaryFieldShow == 'Y' ? 'Yes' : 'No',
          ['Round off in Salary']:
            hrSalary_Fields.rows[i].salaryFieldRound == 'Y' ? 'Yes' : 'No',
          ['Set Round off Type']:
            hrSalary_Fields.rows[i].roundOffType == '0'
              ? 'Ceiling Value'
              : hrSalary_Fields.rows[i].roundOffType == '1'
                ? 'Regular RoundOff'
                : '',
          ['Show digit after decimal point']:
            hrSalary_Fields.rows[i].salaryFieldRoundNo,

          Status: hrSalary_Fields.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Hr Salary Fields', 'xlsx', res);
      return;
    }

    for (var j = 0; j < hrSalary_Fields.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: hrSalary_Fields.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: hrSalary_Fields.rows[j].updateBy,
        },
      });

      if (user1) {
        hrSalary_Fields.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        hrSalary_Fields.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    return res.status(200).json({
      status: 200,
      data: hrSalary_Fields.rows,
      totalcount: hrSalary_Fields.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.postcheckindex = async (req, res, next) => {
  try {
    let { companyMasterID } = req.body;
    let get_data = await HRSalaryFields.findOne({
      where: {
        companyMasterID: companyMasterID,
        salaryFieldIndex: {
          [Sequelize.Op.ne]: null,
        },
      },
      order: [['salaryFieldIndex', 'DESC']],
    });
    let finalindex;
    if (get_data) {
      let index = get_data.salaryFieldIndex;
      finalindex = {
        index: index + 1,
      };
    } else {
      finalindex = {
        index: 1,
      };
    }

    res.status(200).json({ status: 200, data: finalindex });
  } catch (err) {
    next(err);
  }
};
