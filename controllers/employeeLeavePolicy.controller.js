const { Op, Sequelize } = require('sequelize');
const { usermessage } = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const EmployeeLeavePolicy = require('../models/employeeLeavePolicy');
const sequelize = require('../config/database');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const HrLeaveType = require('../models/hrLeaveTypes');
const companyMaster = require('../models/companyMaster');
const employeeLeavePolicy = require('../models/employeeLeavePolicy');
const { generateExcel } = require('../utils/exportData');
const {
  accessibleUsers,
  asiaKolkataDateTime,
  getFinancialYearDatesFromDate,
  employeeeLeaveBalance,
  getUserSalaryMasterByMonth,
  employeeAttendancePolicy,
  attendanceCalculation1,
  getPreviousMonth,
} = require('../utils/commonUtilFunctions');
const empLeavePolicy = require('../models/empLeavePolicy');
const UserLeaveLapse = require('../models/userLeaveLapse');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const EmployeeEmployeement = require('../models/employeeEmployeement');
const cron = require('node-cron');
const LeaveEncashment = require('../models/leaveEncashment');
const _ = require('lodash');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const AttendancePolicy = require('../models/attendancePolicy');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const { attendanceCalculation } = require('./hrLeavesMonthlyTrans.controller');
const EmployeeWeekOff = require('../models/employeeWeekOff');
const weekOffPolicy = require('../models/weekOffPolicy');
const EmployeeLateEarlyPolicy = require('../models/employeeLateEarlyPolicy');
const LateEarlyPolicy = require('../models/lateEarlyPolicy');
const LCEGPenalty = require('../models/lcegPenalty');

exports.createEmployeeLeavePolicy = async (req, res, next) => {
  try {
    const {
      leavePolicyName,
      leaveId,
      companyMasterID,
      leaveType,
      yearlyLeave,
      leaveOperationalYear,
      minDaysRequire,
      earnBaseType,
      creditPeriod,
      creditDate,
      creditType,
      carryForward = 'N',
      carryForwardLimit,
      leavesToCarryForward,
      leaveLapse,
      allowFutureApplyDays,
      allowPastApplyDays,
      allowMinInMonth,
      allowMaxInMonth,
      allowHalfDays,
      employementType,
      leaveEncashment = '0',
      cappingLeaveEncashment,
      min_leave_attachment,
      priority,
      monthly_CF_ENC_LPS = false,
      isMonthly_CF = false,
      monthly_CF_limit = null,
      isMonthly_ENC = false,
      monthly_ENC_limit = null,
      isMonthly_LPS = false,
      monthly_LPS_limit = null,
      quarterly_CF_ENC_LPS = false,
      isQuarterly_CF = false,
      quarterly_CF_limit = null,
      isQuarterly_ENC = false,
      quarterly_ENC_limit = null,
      isQuarterly_LPS = false,
      quarterly_LPS_limit = null,
      halfYearly_CF_ENC_LPS = false,
      isHalfYearly_CF = false,
      halfYearly_CF_limit = null,
      isHalfYearly_ENC = false,
      halfYearly_ENC_limit = null,
      isHalfYearly_LPS = false,
      halfYearly_LPS_limit = null,
      yearly_CF_ENC_LPS = false,
      isYearly_CF = false,
      yearly_CF_limit = null,
      isYearly_ENC = false,
      yearly_ENC_limit = null,
      isYearly_LPS = false,
      yearly_LPS_limit = null,
      fixedAmount_ENC = null,
      payheadIds = null,
      ratio = null,
      allowMaxInQuarter = null,
      allowMaxInHalfYear = null,
      allowMaxInYear = null,
    } = await req.body;

    if (
      yearlyLeave < 0 ||
      (minDaysRequire && minDaysRequire < 0) ||
      +leavesToCarryForward < 0 ||
      cappingLeaveEncashment < 0
    )
      return res.status(200).json({
        status: 401,
        message: 'Leave Days must be positive value.',
      });

    if (creditDate < 0 || creditDate > 28)
      return res.status(200).json({
        status: 401,
        message: 'Leave credit date must be between 1 and 28 .',
      });

    const leaveExists = await HrLeaveMaster.findByPk(leaveId);
    if (!leaveExists)
      return res.status(statusCodes.NOT_FOUND).json({
        status: 401,
        message: usermessage.notFoundMessage('leaveId'),
      });
    const employeeLeave = await EmployeeLeavePolicy.create(
      {
        leavePolicyName,
        leaveId,
        companyMasterId: companyMasterID,
        leaveType,
        yearlyLeave,
        leaveOperationalYear,
        minDaysRequire,
        earnBaseType,
        creditPeriod,
        creditDate,
        creditType,
        carryForward,
        carryForwardLimit,
        leavesToCarryForward,
        leaveLapse,
        allowFutureApplyDays,
        allowPastApplyDays,
        allowMinInMonth,
        allowMaxInMonth,
        allowHalfDays,
        employementType,
        leaveEncashment,
        cappingLeaveEncashment:
          leaveEncashment == '1' ? cappingLeaveEncashment : null,
        min_leave_attachment:
          +min_leave_attachment > 0 ? min_leave_attachment : null,
        priority,
        monthly_CF_ENC_LPS,
        isMonthly_CF,
        monthly_CF_limit,
        isMonthly_ENC,
        monthly_ENC_limit,
        isMonthly_LPS,
        monthly_LPS_limit,
        quarterly_CF_ENC_LPS,
        isQuarterly_CF,
        quarterly_CF_limit,
        isQuarterly_ENC,
        quarterly_ENC_limit,
        isQuarterly_LPS,
        quarterly_LPS_limit,
        halfYearly_CF_ENC_LPS,
        isHalfYearly_CF,
        halfYearly_CF_limit,
        isHalfYearly_ENC,
        halfYearly_ENC_limit,
        isHalfYearly_LPS,
        halfYearly_LPS_limit,
        yearly_CF_ENC_LPS,
        isYearly_CF,
        yearly_CF_limit,
        isYearly_ENC,
        yearly_ENC_limit,
        isYearly_LPS,
        yearly_LPS_limit,
        fixedAmount_ENC,
        payheadIds,
        ratio,
        allowMaxInQuarter,
        allowMaxInHalfYear,
        allowMaxInYear,
      },
      { user: req.userDetails }
    );
    return res.status(statusCodes.OK).json({
      status: 200,
      data: employeeLeave,
      message: usermessage.addMessage('Employee Leave Policy'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listEmployeeLeavePolicy = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      withDeleted,
      leaveId,
      companyMasterID,
      search,
      exportData,
    } = req.query;
    const condition = {};
    if (leaveId) condition.leaveId = +leaveId;

    if (companyMasterID) condition.companyMasterId = companyMasterID;
    if (search)
      condition[Op.or] = [
        { leavePolicyName: { [Op.iLike]: `%${search}%` } },
        { '$companyMaster.companyName$': { [Op.iLike]: `%${search}%` } },
      ];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }
    const employeeLeave = await EmployeeLeavePolicy.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      paranoid: withDeleted !== 'true',
      include: [
        {
          model: HrLeaveMaster,
        },
        {
          model: companyMaster,
        },
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'updatedByUser',
          attributes: userAttributes,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (exportData) {
      const finaldata = employeeLeave.rows.map((e) => {
        return {
          'Employee LeavePolicy Name': e.leavePolicyName,
          'Company Name': e['companyMaster.companyName'],
          Leave: e['hrLeaveMaster.LeaveName'],
          LeaveType: e.leaveType,
          yearlyLeave: e.yearlyLeave,
          leaveOperationalYear: e.leaveOperationalYear,
          minDaysRequire: e.minDaysRequire,
          earnBaseType: e.earnBaseType,
          creditPeriod: e.creditPeriod,
          creditDate: e.creditDate,
          creditType: e.creditType,
          carryForward: e.carryForward,
          carryForwardLimit: e.carryForwardLimit,
          leavesToCarryForward: e.leavesToCarryForward,
          leaveLapse: e.leaveLapse,
          allowFutureApplyDays: e.allowFutureApplyDays,
          allowPastApplyDays: e.allowPastApplyDays,
          allowMinInMonth: e.allowMinInMonth,
          allowMaxInMonth: e.allowMaxInMonth,
          allowHalfDays: e.allowHalfDays,
          employementType: e.employementType.join(','),
          leaveEncashment: e.leaveEncashment,
          cappingLeaveEncashment: e.cappingLeaveEncashment,
        };
      });
      return await generateExcel(
        finaldata,
        'Employee Leave Policy',
        'xlsx',
        res
      );
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Employee Leave'),
      data: employeeLeave.rows,
      totalcount: employeeLeave.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateEmployeeLeavePolicy = async (req, res, next) => {
  try {
    const { id } = await req.params;

    const {
      leavePolicyName,
      leaveId,
      companyMasterId,
      leaveType,
      yearlyLeave,
      leaveOperationalYear,
      minDaysRequire,
      earnBaseType,
      creditPeriod,
      creditDate,
      creditType,
      carryForward = 'N',
      carryForwardLimit,
      leavesToCarryForward,
      leaveLapse,
      allowFutureApplyDays,
      allowPastApplyDays,
      allowMinInMonth,
      allowMaxInMonth,
      allowHalfDays,
      employementType,
      leaveEncashment = '0',
      cappingLeaveEncashment,
      min_leave_attachment,
      priority,
      monthly_CF_ENC_LPS = false,
      isMonthly_CF = false,
      monthly_CF_limit = null,
      isMonthly_ENC = false,
      monthly_ENC_limit = null,
      isMonthly_LPS = false,
      monthly_LPS_limit = null,
      quarterly_CF_ENC_LPS = false,
      isQuarterly_CF = false,
      quarterly_CF_limit = null,
      isQuarterly_ENC = false,
      quarterly_ENC_limit = null,
      isQuarterly_LPS = false,
      quarterly_LPS_limit = null,
      halfYearly_CF_ENC_LPS = false,
      isHalfYearly_CF = false,
      halfYearly_CF_limit = null,
      isHalfYearly_ENC = false,
      halfYearly_ENC_limit = null,
      isHalfYearly_LPS = false,
      halfYearly_LPS_limit = null,
      yearly_CF_ENC_LPS = false,
      isYearly_CF = false,
      yearly_CF_limit = null,
      isYearly_ENC = false,
      yearly_ENC_limit = null,
      isYearly_LPS = false,
      yearly_LPS_limit = null,
      fixedAmount_ENC = null,
      payheadIds = null,
      ratio = null,
      allowMaxInQuarter = null,
      allowMaxInHalfYear = null,
      allowMaxInYear = null,
    } = await req.body;

    if (
      yearlyLeave < 0 ||
      (minDaysRequire && minDaysRequire < 0) ||
      cappingLeaveEncashment < 0
    )
      return res.status(200).json({
        status: 401,
        message: 'Leave Days must be positive value.',
      });
    if (creditDate < 0 || creditDate > 28)
      return res.status(200).json({
        status: 401,
        message: 'Leave credit date must be between 1 and 28 .',
      });

    const employeeLeave = await EmployeeLeavePolicy.findByPk(id, {
      includes: {
        model: companyMaster,
        where: {
          companyMasterId:
            req.userDetails.childCompanies.length > 0
              ? [
                  ...req.userDetails.childCompanies,
                  req.userDetails.companyMasterId,
                ]
              : req.userDetails.companyMasterId,
        },
      },
    });
    if (!employeeLeave)
      return res.status(statusCodes.NOT_FOUND).json({
        status: 401,
        message: usermessage.notFoundMessage('Employee Leave'),
      });

    if (leavePolicyName) employeeLeave.leavePolicyName = leavePolicyName;
    if (leaveType) employeeLeave.leaveType = leaveType;
    if (yearlyLeave) employeeLeave.yearlyLeave = yearlyLeave;
    if (leaveOperationalYear)
      employeeLeave.leaveOperationalYear = leaveOperationalYear;
    if (minDaysRequire) employeeLeave.minDaysRequire = minDaysRequire;
    if (earnBaseType) employeeLeave.earnBaseType = earnBaseType;
    if (creditPeriod) employeeLeave.creditPeriod = creditPeriod;
    if (creditDate) employeeLeave.creditDate = creditDate;
    if (creditType) employeeLeave.creditType = creditType;

    employeeLeave.carryForward = carryForward;
    employeeLeave.carryForwardLimit = carryForwardLimit;
    employeeLeave.leavesToCarryForward = leavesToCarryForward;
    employeeLeave.leaveLapse = leaveLapse;

    employeeLeave.allowFutureApplyDays = allowFutureApplyDays;

    employeeLeave.allowPastApplyDays = allowPastApplyDays;

    employeeLeave.allowMinInMonth = allowMinInMonth;

    employeeLeave.allowMaxInMonth = allowMaxInMonth;

    employeeLeave.allowHalfDays = allowHalfDays;

    employeeLeave.employementType = employementType;

    employeeLeave.leaveEncashment = leaveEncashment;

    employeeLeave.cappingLeaveEncashment =
      leaveEncashment == '1' ? cappingLeaveEncashment : null;

    employeeLeave.min_leave_attachment =
      +min_leave_attachment > 0 ? min_leave_attachment : null;

    (employeeLeave.priority = priority),
      (employeeLeave.monthly_CF_ENC_LPS = monthly_CF_ENC_LPS),
      (employeeLeave.isMonthly_CF = isMonthly_CF),
      (employeeLeave.monthly_CF_limit = monthly_CF_limit),
      (employeeLeave.isMonthly_ENC = isMonthly_ENC),
      (employeeLeave.monthly_ENC_limit = monthly_ENC_limit),
      (employeeLeave.isMonthly_LPS = isMonthly_LPS),
      (employeeLeave.monthly_LPS_limit = monthly_LPS_limit),
      (employeeLeave.quarterly_CF_ENC_LPS = quarterly_CF_ENC_LPS),
      (employeeLeave.isQuarterly_CF = isQuarterly_CF),
      (employeeLeave.quarterly_CF_limit = quarterly_CF_limit),
      (employeeLeave.isQuarterly_ENC = isQuarterly_ENC),
      (employeeLeave.quarterly_ENC_limit = quarterly_ENC_limit),
      (employeeLeave.isQuarterly_LPS = isQuarterly_LPS),
      (employeeLeave.quarterly_LPS_limit = quarterly_LPS_limit),
      (employeeLeave.halfYearly_CF_ENC_LPS = halfYearly_CF_ENC_LPS),
      (employeeLeave.isHalfYearly_CF = isHalfYearly_CF),
      (employeeLeave.halfYearly_CF_limit = halfYearly_CF_limit),
      (employeeLeave.isHalfYearly_ENC = isHalfYearly_ENC),
      (employeeLeave.halfYearly_ENC_limit = halfYearly_ENC_limit),
      (employeeLeave.isHalfYearly_LPS = isHalfYearly_LPS),
      (employeeLeave.halfYearly_LPS_limit = halfYearly_LPS_limit),
      (employeeLeave.yearly_CF_ENC_LPS = yearly_CF_ENC_LPS),
      (employeeLeave.isYearly_CF = isYearly_CF),
      (employeeLeave.yearly_CF_limit = yearly_CF_limit),
      (employeeLeave.isYearly_ENC = isYearly_ENC),
      (employeeLeave.yearly_ENC_limit = yearly_ENC_limit),
      (employeeLeave.isYearly_LPS = isYearly_LPS),
      (employeeLeave.yearly_LPS_limit = yearly_LPS_limit);

    employeeLeave.fixedAmount_ENC = fixedAmount_ENC;
    employeeLeave.payheadIds = payheadIds;
    employeeLeave.ratio = ratio;
    employeeLeave.allowMaxInQuarter = allowMaxInQuarter;
    employeeLeave.allowMaxInHalfYear = allowMaxInHalfYear;
    employeeLeave.allowMaxInYear = allowMaxInYear;

    if (leaveId) {
      const leaveExists = await HrLeaveMaster.findByPk(leaveId);
      if (!leaveExists)
        return res.status(statusCodes.NOT_FOUND).json({
          status: 401,
          message: usermessage.notFoundMessage('leave id'),
        });
      employeeLeave.leaveId = leaveId;
    }
    if (companyMasterId) employeeLeave.companyMasterId = companyMasterId;
    await employeeLeave.save({
      user: req.userDetails,
    });

    return res.status(statusCodes.OK).json({
      status: 200,
      data: employeeLeave,
      message: usermessage.updateMessage('Employee Leave Policy'),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployeeLeavePolicy = async (req, res, next) => {
  try {
    const { id } = await req.params;

    const findData = await empLeavePolicy.findOne({
      where: {
        employeeLeavePolicyID: {
          [Op.contains]: [id],
        },
      },
    });

    if (findData)
      return res.status(200).json({
        status: 401,
        message:
          'Leave Policy already assign to employees.So, you can not delete it.',
      });

    const employeeLeave = await employeeLeavePolicy.findByPk(id, {
      include: [
        {
          model: companyMaster,
          where: {
            companyMasterID:
              req.userDetails.childCompanies.length > 0
                ? [
                    ...req.userDetails.childCompanies,
                    req.userDetails.companyMasterId,
                  ]
                : req.userDetails.companyMasterId,
          },
        },
        { model: HrLeaveMaster },
        // { model: HrLeaveType }, fix this
      ],
      nest: true,
    });
    if (!employeeLeave)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Employee Leave Policy'),
      });

    await employeeLeave.destroy({
      user: req.userDetails,
    });

    return res.status(statusCodes.OK).json({
      status: 200,
      message: usermessage.deleteMessage('Employee Leave Policy'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmpLeavePolicyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employeeLeave = await EmployeeLeavePolicy.findByPk(id, {
      raw: true,
      include: [
        {
          model: HrLeaveMaster,
        },
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
        {
          model: companyMaster,
          where: {
            companyMasterID:
              req.userDetails.childCompanies.length > 0
                ? [
                    ...req.userDetails.childCompanies,
                    req.userDetails.companyMasterId,
                  ]
                : req.userDetails.companyMasterId,
          },
        },
      ],
    });

    if (!employeeLeave)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Employee leave'),
      });

    return res.status(statusCodes.OK).json({
      data: employeeLeave,
      message: usermessage.fetchMessage('Employee leave'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getHrLeaveTypesByComp = async (req, res, next) => {
  try {
    const hrLeaveTypes = await HrLeaveType.findAndCountAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
      order: [['LeaveTranId', 'ASC']],
    });

    return res.status(200).json({
      data: hrLeaveTypes.rows,
      totalcount: hrLeaveTypes.count,
    });
  } catch (err) {
    next(err);
  }
};

// exports.changeStatusByDate = async (req, res, next) => {
//   try {
//     // const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
//     const today = new Date();
//     let get_data = await employeeLeavePolicy.findAll({
//       attributes: ['userMasterID'],
//       where: { applicableDate: today },
//     });
//     let users = [];
//     get_data.forEach((user) => {
//       users.push(user.userMasterID);
//     });

//     let result = await sequelize.transaction(async (t) => {
//       let emp_leave_active = await employeeLeavePolicy.update(
//         {
//           status: 1,
//         },
//         {
//           where: {
//             applicableDate: today,
//             userMasterID: {
//               [Sequelize.Op.in]: users,
//             },
//           },
//           transaction: t,
//         }
//       );

//       let deactive_prev = await employeeLeavePolicy.update(
//         {
//           status: 0,
//           endDate: today,
//         },
//         {
//           where: {
//             userMasterID: {
//               [Sequelize.Op.in]: users,
//             },
//             applicableDate: {
//               [Sequelize.Op.ne]: today,
//             },
//           },
//           transaction: t,
//         }
//       );

//       return emp_leave_active;
//     });
//   } catch (err) {
//     next(err);
//   }
// };

exports.getLeavePolicyBycompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await employeeLeavePolicy.findAll({
      raw: true,
      where: {
        companyMasterId: id,
      },
    });

    return res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

function getPriorityWiseBalance(
  balance = 0,
  config,
  priority = [],
  period = ''
) {
  let result = { encashment: 0, carryForward: 0, lapse: 0 };

  const period1 =
    period == 'HalfYearly' ? 'halfYearly' : String(period).toLowerCase();

  for (let type of priority) {
    if (balance <= 0) break;

    if (type === 'encashment' && config[`is${period}_ENC`]) {
      let limit = config[`${period1}_ENC_limit`] ?? 0;
      if (limit === 0 || limit >= balance) {
        result.encashment = balance;
        balance = 0;
      } else {
        result.encashment = limit;
        balance -= limit;
      }
    } else if (type === 'carryForward' && config[`is${period}_CF`]) {
      let limit = config[`${period1}_CF_limit`] ?? 0;
      if (limit === 0 || limit >= balance) {
        result.carryForward = balance;
        balance = 0;
      } else {
        result.carryForward = limit;
        balance -= limit;
      }
    } else if (type === 'lapse' && config[`is${period}_LPS`]) {
      let limit = config[`${period1}_LPS_limit`] ?? 0;
      if (limit === 0 || limit >= balance) {
        result.lapse = balance;
        balance = 0;
      } else {
        result.lapse = limit;
        balance -= limit;
      }
    }
  }

  return result;
}

async function bulkInsertInChunks(model, data, chunkSize = 1000) {
  const chunks = _.chunk(data, chunkSize);
  for (const chunk of chunks) {
    await model.bulkCreate(chunk);
  }
}

exports.employeeLeavePolicyCron = async (req, res, next) => {
  try {
    console.log('Leave cron started----------------------');
    const finalDataToAddLeave = [],
      finalDataToLapse = [],
      finalDataToEncashment = [];

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);
    const onlyDate = date.slice(8, 10);
    const currentMonth = date.slice(0, 4) + date.slice(5, 7);

    const AllEmployeeLeavePolicyData = await EmployeeLeavePolicy.findAll({
      where: {
        creditDate: +onlyDate,
      },
    });

    const leavePolicyIds = AllEmployeeLeavePolicyData.map((e) => e.id);

    if (!leavePolicyIds.length) return;

    const subquery = `
      SELECT DISTINCT ON ("userMasterID") *
      FROM "empLeavePolicies"
      WHERE "status" = 1
      AND "applicableDate" <= :date
      AND ("endDate" >= :date OR "endDate" IS NULL)
      AND "employeeLeavePolicyID" && ARRAY[:policyIDs]::integer[]
      ORDER BY "userMasterID", "applicableDate" DESC
    `;

    const AllEmployeeLeavePolicy = await empLeavePolicy.sequelize.query(
      subquery,
      {
        replacements: { date: new Date(date), policyIDs: leavePolicyIds },
        model: empLeavePolicy,
        mapToModel: true,
      }
    );

    // const AllEmployeeLeavePolicy = await empLeavePolicy.findAll({
    //   raw: true,
    //   where: {
    //     status: 1,
    //     userMasterID: [30549],
    //     applicableDate: {
    //       [Sequelize.Op.lte]: new Date(date),
    //     },
    //     [Sequelize.Op.or]: [
    //       {
    //         endDate: {
    //           [Sequelize.Op.gte]: new Date(date),
    //         },
    //       },
    //       {
    //         endDate: null,
    //       },
    //     ],
    //   },
    //   include: [
    //     {
    //       required: true,
    //       model: UserMaster,
    //       as: 'employee',
    //       // where: { companyMasterId: 68 },
    //     },
    //   ],
    // });

    const allUserIds = AllEmployeeLeavePolicy.map((e) => e.userMasterID);

    // find All user Data

    const userMaster = await UserMaster.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: allUserIds,
        },
        status: 1,
      },
      include: [
        {
          required: false,
          model: HrLeaveMonthlyTrans,
          where: {
            AttnYearMon: +currentMonth,
          },
          attributes: [
            'AttnTranId',
            'LeaveTranId',
            'AttnVal',
            'userMasterID',
            'AttnYearMon',
            'monthstartdate',
            'monthenddate',
            'verified',
            'updateBy',
            'MonWorkDays',
          ],
          include: [
            {
              model: HrLeaveTypes,
              attributes: ['LeaveID'],
              include: [
                {
                  model: HrLeaveMaster,
                  as: 'LeaveMaster',
                  attributes: ['LeaveName'],
                },
              ],
            },
          ],
        },
        {
          model: EmployeeJoiningDetails,
          attributes: [
            'employeeCode',
            'joiningDate',
            'leavingDate',
            'salaryCalculationAct',
            'fullMonthPresence',
          ],
        },
        {
          required: false,
          model: EmployeeSalaryPolicy,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(date),
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['salaryPolicyID'],
          include: [{ model: SalaryPolicy, as: 'salaryPolicy' }],
        },
        {
          model: EmployeeAttendancePolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(date) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          required: false,
          attributes: ['attendancePolicyID', 'startDate', 'endDate'],
          include: [
            {
              model: AttendancePolicy,
              as: 'attendancePolicy',
              attributes: [
                'attendancePolicyID',
                'sandwichLeave',
                'BeforeAfterLeave',
                ['weekoffsandwichLeave', 'wh_sandwich'],
                ['holidaysandwichLeave', 'ph_sandwich'],
                ['HFDBeforeAfterLeave', 'HFD_Be_Aft'],
                'WHPHPriority',
                'coff',
              ],
            },
          ],
        },
        {
          required: true,
          model: EmployeeEmployeement,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(date),
                },
              },
              {
                endDate: null,
              },
            ],
          },
        },
        // weeoffPolicy
        {
          model: EmployeeWeekOff,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(date) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          required: false,
          attributes: ['weekOffPolicyID', 'applicableDate', 'endDate'],
          include: [
            {
              model: weekOffPolicy,
              as: 'weekoff',
            },
          ],
        },
        // LCEG Policy Data
        {
          required: false,
          model: EmployeeLateEarlyPolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(date) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          include: [
            {
              model: LateEarlyPolicy,
              as: 'lateEarlyPolicy',
              attributes: ['lateEarlyPolicyType', 'deductFrom'],
            },
          ],
        },
        // LCEG Penalty
        {
          required: false,
          model: LCEGPenalty,
          where: {
            YYYYMM: +currentMonth,
          },
        },
      ],
      attributes: [
        'userMasterID',
        'firstName',
        'lastName',
        'displayName',
        'userNumber',
        'photo',
        'companyMasterId',
        'gender',
      ],
      order: [['displayName', 'ASC']],
    });

    const allCompanyIds = [
      ...new Set(userMaster.map((e) => e.companyMasterId)),
    ];

    const AllCompanyHrleaveType = await HrLeaveType.findAll({
      where: {
        status: 1,
        companyMasterID: allCompanyIds,
      },
      include: [
        { model: HrLeaveMaster, as: 'LeaveMaster', attributes: ['LeaveName'] },
      ],
    });

    const generateQuarterlyDates = (startDate, creditType) => {
      const dates = [];
      const qtDate = new Date(startDate);

      if (creditType === 'Post') {
        qtDate.setMonth(qtDate.getMonth() + 3);
      }

      for (let i = 0; i < 4; i++) {
        if (i > 0) qtDate.setMonth(qtDate.getMonth() + 3);
        dates.push(asiaKolkataDateTime(qtDate).slice(0, 10));
      }

      return dates;
    };

    const generateHalfYearlyDates = (startDate, creditType) => {
      const dates = [];
      const hfDate = new Date(startDate);

      if (creditType === 'Post') {
        hfDate.setMonth(hfDate.getMonth() + 6);
      }

      for (let i = 0; i < 2; i++) {
        if (i > 0) hfDate.setMonth(hfDate.getMonth() + 6);
        dates.push(asiaKolkataDateTime(hfDate).slice(0, 10));
      }

      return dates;
    };

    // function to format the date as 'YYYYMM'
    const formatMonth = (date) => {
      return date.toISOString().slice(0, 4) + date.toISOString().slice(5, 7);
    };

    // loop through all employee leave policy
    for (const empLeavePolicy of AllEmployeeLeavePolicy) {
      // Employee Data
      const userData = userMaster.find(
        (e) => e.userMasterID == empLeavePolicy.userMasterID
      );

      if (!userData) continue;

      const companyWiseLeaveType = AllCompanyHrleaveType.filter(
        (e) => e.companyMasterID == userData.companyMasterId
      );
      // calculate attendance
      const attendancedataCal = await attendanceCalculation1(
        userData,
        currentMonth,
        '',
        companyWiseLeaveType
      );

      const unverifiedData = attendancedataCal.filter((e) => e.verified == 0);

      if (
        unverifiedData.length &&
        unverifiedData[0].user_leave &&
        unverifiedData[0].user_leave.length
      ) {
        const toAddData = [],
          toAddLCEGPenaltyData = [];

        // for penalty

        for (const penalty of unverifiedData[0]?.penaltyArray || []) {
          toAddLCEGPenaltyData.push({
            userMasterID: unverifiedData[0].userMasterID,
            YYYYMM: +unverifiedData[0].yearMonth,
            penaltyType: penalty.penaltyType,
            penaltyValue: penalty.values,
            createBy: unverifiedData[0].userMasterID,
          });
        }

        for (let m = 0; m < unverifiedData[0].user_leave.length; m++) {
          toAddData.push({
            userMasterID: unverifiedData[0].userMasterID,
            LeaveTranId: unverifiedData[0].user_leave[m].leavetranid,
            AttnYearMon: unverifiedData[0].yearMonth,
            MonDays: unverifiedData[0].MonDays,
            MonWorkDays: unverifiedData[0].WorkingDays,
            AttnVal: unverifiedData[0].user_leave[m].values,
            monthstartdate: unverifiedData[0].start_date,
            monthenddate: unverifiedData[0].end_date,
            branchID: unverifiedData[0].branchid,
            departmentID: unverifiedData[0].departid,
            designationID: unverifiedData[0].desigid,
            createBy: unverifiedData[0].userMasterID,
          });
        }

        //delete data

        await sequelize.transaction(async (t) => {
          await HrLeaveMonthlyTrans.destroy({
            where: {
              userMasterID: unverifiedData[0].userMasterID,
              AttnYearMon: currentMonth,
            },
            transaction: t,
          });

          await LCEGPenalty.destroy({
            where: {
              userMasterID: unverifiedData[0].userMasterID,
              YYYYMM: currentMonth,
            },
            transaction: t,
          });

          await HrLeaveMonthlyTrans.bulkCreate(toAddData, { transaction: t });
          await LCEGPenalty.bulkCreate(toAddLCEGPenaltyData, {
            hooks: false,
            transaction: t,
          });
        });
      }

      // find employee employeement
      const empEmployeement = userData.employeeEmployeements?.[0] || null;

      if (!empEmployeement) continue;

      // find All employee leave policy of user
      const AllLeavePolicy = AllEmployeeLeavePolicyData.filter((e) =>
        [...empLeavePolicy.employeeLeavePolicyID].includes(e.id)
      );

      if (AllLeavePolicy.length === 0) continue;

      const AllLeaveIDS = AllLeavePolicy.map((e) => e.leaveId);
      // leave type which set in leave policy
      const hrleaveTypesData = companyWiseLeaveType.filter((e) =>
        [...AllLeaveIDS].includes(e.LeaveID)
      );

      for (const leavePolicy of AllLeavePolicy) {
        // check user employeement is present in leave policy or not
        const employeementPresent = leavePolicy.employementType.some(
          (d) => d === empEmployeement.employeement
        );

        if (!employeementPresent) continue;
        // find leave types
        const currentLeavetype = hrleaveTypesData.find(
          (e) => e.LeaveID == leavePolicy.leaveId
        );

        if (!currentLeavetype) continue;

        // set startDate as default year
        let startDate = date.slice(0, 4) + '-' + '01' + '-' + '01';

        if (leavePolicy.leaveOperationalYear == 'April To March') {
          const dates = await getFinancialYearDatesFromDate(date);
          startDate = dates.startDate;
        }

        const temp_startDate =
          startDate.slice(0, 8) +
          String(leavePolicy.creditDate).padStart(2, '0');

        let addDataFlag = false;

        // ---------------------------------- Earn Basis OR PRO RATA ----------------------------------------

        if (leavePolicy.leaveType == 'Earn basis') {
          const Months_TO_findAttendance = [];

          // Add previous month for Monthly
          if (leavePolicy.creditPeriod === 'Monthly') {
            const tempdate = new Date(date);
            tempdate.setMonth(tempdate.getMonth() - 1);
            Months_TO_findAttendance.push(formatMonth(tempdate));
          }

          // Add previous three months for Quarterly
          if (leavePolicy.creditPeriod === 'Quarterly') {
            for (let i = 1; i <= 3; i++) {
              const tempdate = new Date(date);
              tempdate.setMonth(tempdate.getMonth() - i);
              Months_TO_findAttendance.push(formatMonth(tempdate));
            }
          }

          // Add previous six months for Half Yearly
          if (leavePolicy.creditPeriod === 'Half Yearly') {
            for (let i = 1; i <= 6; i++) {
              const tempdate = new Date(date);
              tempdate.setMonth(tempdate.getMonth() - i);
              Months_TO_findAttendance.push(formatMonth(tempdate));
            }
          }

          // Add previous twelve months for Yearly
          if (leavePolicy.creditPeriod === 'Yearly') {
            for (let i = 1; i <= 12; i++) {
              const tempdate = new Date(date);
              tempdate.setMonth(tempdate.getMonth() - i);
              Months_TO_findAttendance.push(formatMonth(tempdate));
            }
          }

          // find latest attendance data

          const EmployeeAttendance = await HrLeaveMonthlyTrans.findAll({
            raw: true,
            where: {
              userMasterID: empLeavePolicy.userMasterID,
              AttnYearMon: {
                [Op.in]: Months_TO_findAttendance,
              },
            },
            include: [{ model: HrLeaveType, attributes: [] }],
            attributes: [
              'userMasterID',
              'AttnVal',
              [Sequelize.col('hrLeaveType.LeaveID'), 'LeaveID'],
            ],
          });

          let totalDays = 0;
          // if physical Present
          if (leavePolicy.earnBaseType == 'Physical Present') {
            totalDays = EmployeeAttendance.filter(
              (e) =>
                e.userMasterID == empLeavePolicy.userMasterID && e.LeaveID == 1
            ).reduce((acc, obj) => acc + +obj.AttnVal, 0);
          }
          // if Physical Present + Weekly Off

          if (leavePolicy.earnBaseType == 'Physical Present + Weekly Off') {
            totalDays = EmployeeAttendance.filter(
              (e) =>
                e.userMasterID == empLeavePolicy.userMasterID &&
                (e.LeaveID == 1 || e.LeaveID == 7)
            ).reduce((acc, obj) => acc + +obj.AttnVal, 0);
          }

          // if Physical present + Weekly Off+ Leave

          if (
            leavePolicy.earnBaseType == 'Physical present + Weekly Off+ Leave'
          )
            totalDays = EmployeeAttendance.filter(
              (e) =>
                e.userMasterID == empLeavePolicy.userMasterID &&
                ![5, 18, 9, 20, 21, 22, 24, 28, 29, 30, 31, 32].includes(
                  e.LeaveID
                )
            ).reduce((acc, obj) => acc + +obj.AttnVal, 0);

          // if paid days

          if (leavePolicy.earnBaseType == 'Paid Days')
            totalDays = EmployeeAttendance.filter(
              (e) =>
                e.userMasterID == empLeavePolicy.userMasterID &&
                ![5, 18, 20, 21, 22, 24, 28, 29, 30, 31, 32].includes(e.LeaveID)
            ).reduce((acc, obj) => acc + +obj.AttnVal, 0);

          // if minimum required days is greater than user present day
          if (+leavePolicy.minDaysRequire > +totalDays) continue;
        }

        let leaveMonth = String(date.slice(0, 4)) + String(date.slice(5, 7));
        let toAddLeave_Date_Pre =
          date.slice(0, 8) + String(leavePolicy.creditDate).padStart(2, '0');

        if (leavePolicy.creditPeriod == 'Monthly') {
          if (
            new Date(toAddLeave_Date_Pre).getTime() == new Date(date).getTime()
          ) {
            if (leavePolicy.creditType == 'Post') {
              const addDate = new Date(toAddLeave_Date_Pre);
              addDate.setMonth(addDate.getMonth() - 1);
              leaveMonth = addDate.toISOString().slice(0, 7).replace('-', '');
              console.log(
                leaveMonth,
                '---------------------------------leaveMonth---------------------'
              );
            }

            if (+leavePolicy.yearlyLeave > 0) {
              finalDataToAddLeave.push({
                LeaveTranId: currentLeavetype.LeaveTranId,
                userMasterID: empLeavePolicy.userMasterID,
                YearMM: +leaveMonth,
                LeaveAddNew: +leavePolicy.yearlyLeave,
                createBy: empLeavePolicy.userMasterID,
              });
              addDataFlag = true;
            }
          }
        }

        if (leavePolicy.creditPeriod == 'Quarterly') {
          const allQuarterlyDates = generateQuarterlyDates(
            temp_startDate,
            leavePolicy.creditType
          );
          // current date is present
          const datePresentOrNot = allQuarterlyDates.some((d) => d === date);
          if (!datePresentOrNot) addDataFlag = true;
        }

        if (leavePolicy.creditPeriod == 'Half Yearly') {
          const allHalfYearlyDates = generateHalfYearlyDates(
            temp_startDate,
            leavePolicy.creditType
          );
          // current date is present
          const datePresentOrNot = allHalfYearlyDates.some((d) => d === date);

          if (!datePresentOrNot) addDataFlag = true;
        }

        if (leavePolicy.creditPeriod == 'Yearly') {
          let yearlyDate = temp_startDate;
          if (leavePolicy.creditType == 'Post') {
            const y_date = new Date(yearlyDate);
            y_date.setMonth(y_date.getMonth() + 12);
            yearlyDate = asiaKolkataDateTime(y_date).slice(0, 10);
          }

          if (yearlyDate != date) addDataFlag = true;
        }
        // -------------push leave to add data-----------------

        if (!addDataFlag && +leavePolicy.yearlyLeave > 0) {
          finalDataToAddLeave.push({
            LeaveTranId: currentLeavetype.LeaveTranId,
            userMasterID: empLeavePolicy.userMasterID,
            YearMM: +leaveMonth,
            LeaveAddNew: +leavePolicy.yearlyLeave,
            createBy: empLeavePolicy.userMasterID,
          });
        }

        // ----------------- Leave Encashment ----------------------

        const priority = leavePolicy.priority || [];

        if (!priority || (priority && !priority.length)) continue;

        // Employee Leave Balance

        const currentEmpLeaveBalanceData = await employeeeLeaveBalance(
          AllLeavePolicy[0].companyMasterId,
          empLeavePolicy.userMasterID
        );

        const balanceData = currentEmpLeaveBalanceData.find(
          (e) => e.LeaveID == leavePolicy.leaveId
        );

        const balance = balanceData ? balanceData.Balance : 0;

        const final_Priority_Balance = [];

        // if monthly set
        if (leavePolicy.monthly_CF_ENC_LPS) {
          if (
            new Date(toAddLeave_Date_Pre).getTime() == new Date(date).getTime()
          ) {
            const data = {
              isMonthly_CF: leavePolicy.isMonthly_CF,
              monthly_CF_limit: leavePolicy.monthly_CF_limit,
              isMonthly_ENC: leavePolicy.isMonthly_ENC,
              monthly_ENC_limit: leavePolicy.monthly_ENC_limit,
              isMonthly_LPS: leavePolicy.isMonthly_LPS,
              monthly_LPS_limit: leavePolicy.monthly_LPS_limit,
            };
            final_Priority_Balance.push(
              getPriorityWiseBalance(balance, data, priority, 'Monthly')
            );
          }
        }

        // if quarterly set
        if (leavePolicy.quarterly_CF_ENC_LPS) {
          const allQuarterlyDates = generateQuarterlyDates(temp_startDate, '');
          // current date is present
          const datePresentOrNot = allQuarterlyDates.some((d) => d === date);

          if (datePresentOrNot) {
            const data = {
              isQuarterly_CF: leavePolicy.isQuarterly_CF,
              quarterly_CF_limit: leavePolicy.quarterly_CF_limit,
              isQuarterly_ENC: leavePolicy.isQuarterly_ENC,
              quarterly_ENC_limit: leavePolicy.quarterly_ENC_limit,
              isQuarterly_LPS: leavePolicy.isQuarterly_LPS,
              quarterly_LPS_limit: leavePolicy.quarterly_LPS_limit,
            };

            final_Priority_Balance.push(
              getPriorityWiseBalance(balance, data, priority, 'Quarterly')
            );
          }
        }

        // if Half yearly
        if (leavePolicy.halfYearly_CF_ENC_LPS) {
          const allHalfYearlyDates = generateHalfYearlyDates(
            temp_startDate,
            ''
          );
          // current date is present
          const datePresentOrNot = allHalfYearlyDates.some((d) => d === date);
          if (datePresentOrNot) {
            const data = {
              isHalfYearly_CF: leavePolicy.isHalfYearly_CF,
              halfYearly_CF_limit: leavePolicy.halfYearly_CF_limit,
              isHalfYearly_ENC: leavePolicy.isHalfYearly_ENC,
              halfYearly_ENC_limit: leavePolicy.halfYearly_ENC_limit,
              isHalfYearly_LPS: leavePolicy.isHalfYearly_LPS,
              halfYearly_LPS_limit: leavePolicy.halfYearly_LPS_limit,
            };

            final_Priority_Balance.push(
              getPriorityWiseBalance(balance, data, priority, 'HalfYearly')
            );
          }
        }

        // if yearly
        if (leavePolicy.yearly_CF_ENC_LPS) {
          let yearlyDate = temp_startDate;

          if (yearlyDate == date) {
            const data = {
              isYearly_CF: leavePolicy.isYearly_CF,
              yearly_CF_limit: leavePolicy.yearly_CF_limit,
              isYearly_ENC: leavePolicy.isYearly_ENC,
              yearly_ENC_limit: leavePolicy.yearly_ENC_limit,
              isYearly_LPS: leavePolicy.isYearly_LPS,
              yearly_LPS_limit: leavePolicy.yearly_LPS_limit,
            };

            final_Priority_Balance.push(
              getPriorityWiseBalance(balance, data, priority, 'Yearly')
            );
          }
        }

        const Total_encash = final_Priority_Balance.reduce(
          (acc, obj) => acc + +obj.encashment,
          0
        );
        const Total_carryForward = final_Priority_Balance.reduce(
          (acc, obj) => acc + +obj.carryForward,
          0
        );
        const Total_lapse = final_Priority_Balance.reduce(
          (acc, obj) => acc + +obj.lapse,
          0
        );

        let currentBalance = balance;

        for (const type of priority) {
          if (type == 'encashment' && +Total_encash > 0) {
            const leave_To_encash =
              currentBalance >= +Total_encash ? +Total_encash : +currentBalance;
            currentBalance -= +leave_To_encash;
            // push encashment data
            if (+leave_To_encash > 0) {
              finalDataToEncashment.push({
                LeaveTranId: currentLeavetype.LeaveTranId,
                userMasterID: empLeavePolicy.userMasterID,
                YYYYMM: getPreviousMonth(leaveMonth),
                days: +leave_To_encash,
                createBy: empLeavePolicy.userMasterID,
              });
            }
          }
          // lapse data
          if (type == 'lapse' && +Total_lapse > 0) {
            const leave_To_lapse =
              currentBalance >= +Total_lapse ? +Total_lapse : +currentBalance;
            currentBalance -= +leave_To_lapse;

            if (leave_To_lapse > 0) {
              finalDataToLapse.push({
                LeaveTranId: currentLeavetype.LeaveTranId,
                userMasterID: empLeavePolicy.userMasterID,
                LapseYearMonth: leaveMonth,
                LapseDays: +leave_To_lapse,
                createBy: empLeavePolicy.userMasterID,
                status: 1,
              });
            }
          }

          // carryfoward data
          if (type == 'carryForward' && +Total_carryForward > 0) {
            const leave_To_CF =
              currentBalance >= +Total_carryForward
                ? +Total_carryForward
                : +currentBalance;
            currentBalance -= +leave_To_CF;
          }
        }
      }
    }

    // add data in chunks
    await bulkInsertInChunks(LeaveEncashment, finalDataToEncashment, 1000);
    await bulkInsertInChunks(UserLeaveLapse, finalDataToLapse, 1000);
    await bulkInsertInChunks(HrLeaveBalance, finalDataToAddLeave, 1000);

    console.log('Leave cron finished----------------------');

    return;
  } catch (error) {
    console.log(error);
    next(error);
  }
};

if (process.env.NODE_ENV === 'production') {
  cron.schedule(
    '05 04 * * *',
    async () => {
      await this.employeeLeavePolicyCron();
    },
    { name: 'daily-leavepolicycron' }
  );
}
