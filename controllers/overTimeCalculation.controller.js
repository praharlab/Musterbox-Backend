const overTimeCalculation = require('../models/overTimeCalculation');
const overTimeCalculationMain = require('../models/overTimeCalculationMain');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');
const message = require('../response_message/message');
const attendanceTransaction = require('../models/attendanceTransaction');
const attendanceLog = require('../models/attendancelogs');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const userOverTimePolicyAssign = require('../models/userOverTimePolicyAssign');
const EmployeeAttendance = require('../models/employeeAttendancePolicy');
const moment = require('moment');
const { executeQuery } = require('./common.controller');
const employeeSalaryPolicies = require('../models/employeeSalaryPolicy');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const UserMaster = require('../models/userMaster');
const AttendancePolicy = require('../models/attendancePolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const EmployeeBranch = require('../models/employeeBranch');
const {
  employeeSalaryPolicy,
  employeeAttendancePolicy,
  daysInMonth,
  getAllUserByCompanyDateWise,
  getAllUserByBranchDateWise,
  employeeBranch,
  getUserByBranchandDateRange,
  getUserByCompanyandDateRange,
  employeeDepartment,
  employeeDesignation,
  asiaKolkataDateTime,
  getUserSalaryMasterByMonth,
  toGetFormateddate,
} = require('../utils/commonUtilFunctions');
const {
  generateChecklistExcel,
  generateExcel,
} = require('../utils/exportData');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const BranchMaster = require('../models/branchMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const overtimeAuthorizationRequest = require('../models/overtimeAuthorization');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const { authorizationMasterTypes } = require('../utils/dbUtils');

// To Calculate OT Amount
const calculateOvertimeAmount = (perminute_gross, userOvertime_Min, ratio) => {
  return +userOvertime_Min * +perminute_gross * +ratio;
};

//To GET Per Minute Gross
const getPerMinuteGross = (perday_gross, overtimeHrs) => {
  return overtimeHrs ? +perday_gross / +overtimeHrs : +perday_gross / 480;
};

exports.calculateOvertime = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      branchMasterID,
      yearmonth,
      ratio,
      createByIp,
      // createBy,
    } = await req.body;

    const toAddOvertimeData = [];

    let month = yearmonth.slice(4, 6);
    let year = yearmonth.slice(0, 4);
    let monday = daysInMonth(month, year);

    const endDate = year + '-' + month + '-' + monday;
    const startDate = year + '-' + month + '-' + '01';

    const Alluser = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        status: 1,
      },
      ...accessibleUsers(req.userDetails, false, false),
      include: [
        {
          model: EmployeeBranch,
          where: {
            ...(branchMasterID && { branchID: branchMasterID }),
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(endDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: branchMasterID ? true : false,
          attributes: ['branchID', 'applicableDate'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
              attributes: ['branchName'],
            },
          ],
        },
        { model: EmployeeJoiningDetails, attributes: ['salaryCalculationAct'] },
      ],
      attributes: ['userMasterID'],
    });

    const AllIds = Alluser.map((u) => u.userMasterID);

    const [AlluserSalaryPolicy, AlluserCalculatedOvertime] = await Promise.all([
      EmployeeSalaryPolicy.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Sequelize.Op.in]: AllIds,
          },
          status: 1,
          startDate: {
            [Sequelize.Op.lte]: new Date(endDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(endDate) },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        include: [
          {
            model: SalaryPolicy,
            as: 'salaryPolicy', // Alias
          },
        ],
      }),
      overTimeCalculationMain.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Sequelize.Op.in]: AllIds,
          },
          yyyymm: yearmonth,
        },
      }),
    ]);

    async function calculateOTDays(
      user,
      userattendancePolicy,
      monthDays,
      start_date,
      end_date,
      overtimeCalculationDays
    ) {
      const getWeekoffHolidays = async () => {
        return await weekoffHolidayTran.findAll({
          where: {
            userMasterID: user.userMasterID,
            date: {
              [Sequelize.Op.between]: [start_date, end_date],
            },
            [Sequelize.Op.and]: Sequelize.literal(`(date, "tableName") IN (
              SELECT date, MAX("tableName") AS max_tableName
              FROM "weekoffHolidayTrans"
              WHERE "userMasterID" = ${user.userMasterID}
                AND date BETWEEN '${start_date}' AND '${end_date}' AND ("optionalHoliday" IS FALSE OR  "optionalHoliday" IS null)
              GROUP BY date
            )`),
          },
          order: [
            ['date', 'ASC'],
            ['tableName', 'DESC'],
          ],
        });
      };

      if (
        ['grossSalary', 'basicSalary', 'ctcSalary'].includes(
          userattendancePolicy.payType
        ) &&
        +userattendancePolicy.monthDays > 0
      ) {
        return +userattendancePolicy.monthDays;
      }

      if (user.employeeJoiningDetails.length > 0) {
        if (user.employeeJoiningDetails[0].salaryCalculationAct === 'F') {
          const weekoff = (await getWeekoffHolidays())
            .filter((e) => e.tableName == 'weekoff')
            .reduce((acc, obj) => acc + +obj.value, 0);
          return Number(monthDays) - Number(weekoff);
        } else if (
          user.employeeJoiningDetails[0].salaryCalculationAct === 'W'
        ) {
          const weekoffHoliday = (await getWeekoffHolidays()).reduce(
            (acc, obj) => acc + +obj.value,
            0
          );
          return Number(monthDays) - Number(weekoffHoliday);
        }
      }

      return overtimeCalculationDays || monthDays;
    }

    for (const user of Alluser) {
      const calculated_OT = AlluserCalculatedOvertime.find(
        (e) => e.userMasterID == user.userMasterID
      );
      if (calculated_OT) continue;

      const user_salaryPolicy = AlluserSalaryPolicy.find(
        (e) => e.userMasterID == user.userMasterID
      );

      let start_date = startDate,
        end_date = endDate,
        overtimeCalculationDays,
        monthDays = monday;

      if (user_salaryPolicy) {
        let date = user_salaryPolicy['salaryPolicy.salaryCycleDate'];
        date = (date < 10 ? '0' : '') + date;

        start_date = year + '-' + month + '-' + date;

        // To Check salary consider Month

        if (user_salaryPolicy['salaryPolicy.salaryCycleConsider'] == 'E') {
          const tempDate = new Date(start_date);
          tempDate.setMonth(tempDate.getMonth() - 1);

          start_date =
            tempDate.getFullYear() +
            '-' +
            String(tempDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(tempDate.getDate()).padStart(2, '0');

          // set Month days
          monthDays = daysInMonth(
            start_date.slice(5, 7),
            start_date.slice(0, 4)
          );
        }

        let date1 = new Date(start_date);
        date1.setDate(date1.getDate() + (monthDays - 1));

        end_date =
          date1.getFullYear() +
          '-' +
          String(date1.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date1.getDate()).padStart(2, '0');

        overtimeCalculationDays =
          user_salaryPolicy['salaryPolicy.salaryCalculationDays'];
      }

      // overtime data

      const overtimeData = await overTimeCalculation.findAll({
        raw: true,
        where: {
          UserMasterID: user.userMasterID,
          OverTimeDate: {
            [Sequelize.Op.between]: [start_date, end_date],
          },
          AuthorizationRequired: 3,
        },
        attributes: [
          'OverTimeDate',
          'UpdateTimeInDateTime',
          'UpdateTimeOutDateTime',
          'UpdateOverTimeHourAndMin',
        ],
        order: [['OverTimeDate', 'ASC']],
      });

      // Total OVERTiME minutes of user
      const userOvertime_Min = overtimeData.reduce(
        (acc, obj) => acc + +obj.UpdateOverTimeHourAndMin,
        0
      );

      if (overtimeData.length === 0 || +userOvertime_Min <= 0) continue;

      // user salary data and user employeeAttendancePolicy

      const [salarydata, userattendancePolicy] = await Promise.all([
        getUserSalaryMasterByMonth(user.userMasterID, yearmonth),
        employeeAttendancePolicy(user.userMasterID, end_date),
      ]);

      if (+salarydata.length === 0 || !userattendancePolicy) continue;

      // get Days to divide monthly Amount
      const toCalculateOTdays = await calculateOTDays(
        user,
        userattendancePolicy,
        monthDays,
        start_date,
        end_date,
        overtimeCalculationDays
      );

      const gross =
        userattendancePolicy.payType == 'ctcSalary'
          ? salarydata.find((e) => e.payheadMasterId == 1)?.EmployeeSalaryAmount
          : salarydata.find((e) => e.payheadMasterId == 50)
              ?.EmployeeSalaryAmount || 0;

      // salary structure type
      const baseoncalculation = salarydata[0].baseOnCalculation;
      // Basic salary of user
      const basicsalary = salarydata.find((e) => e.payheadMasterId == 2);

      let rateBy,
        overtimeAmount = 0,
        perday_gross = 0,
        perminute_gross = 0;

      if (userattendancePolicy.payType == 'fixedAmount') {
        rateBy = 'fixedAmount';
        perday_gross = +userattendancePolicy.payAmount;
        overtimeAmount = calculateOvertimeAmount(
          perday_gross / 60,
          userOvertime_Min,
          ratio
        );
      } else {
        if (baseoncalculation == 'M') {
          if (
            ['grossSalary', 'ctcSalary'].includes(userattendancePolicy.payType)
          ) {
            rateBy =
              userattendancePolicy.payType == 'ctcSalary'
                ? 'dailyCTC'
                : 'daily';
            perday_gross = Number(gross) / Number(toCalculateOTdays);
          } else if (userattendancePolicy.payType == 'basicSalary') {
            rateBy = 'dailybasic';
            perday_gross =
              (basicsalary ? +basicsalary.EmployeeSalaryAmount : 0) /
              Number(toCalculateOTdays);
          }
        } else if (baseoncalculation == 'D' || baseoncalculation == 'H') {
          if (
            ['grossSalary', 'ctcSalary'].includes(userattendancePolicy.payType)
          ) {
            rateBy =
              baseoncalculation == 'H'
                ? userattendancePolicy.payType == 'ctcSalary'
                  ? 'hourlyCTC'
                  : 'hourly'
                : userattendancePolicy.payType == 'ctcSalary'
                  ? 'dailyCTC'
                  : 'daily';
            perday_gross = Number(gross);
          } else if (userattendancePolicy.payType == 'basicSalary') {
            rateBy = baseoncalculation == 'H' ? 'hourlybasic' : 'dailybasic';
            perday_gross = basicsalary ? +basicsalary.EmployeeSalaryAmount : 0;
          }
        }

        if (baseoncalculation == 'H') {
          perminute_gross = Number(perday_gross) / 60;
        } else {
          perminute_gross = getPerMinuteGross(
            perday_gross,
            userattendancePolicy.overtimeHrs
          );
        }

        overtimeAmount = calculateOvertimeAmount(
          perminute_gross,
          userOvertime_Min,
          ratio
        );
      }

      // // condition for SRI VAISHNAVI RETAIL (INDIA) LLP
      // if (companyMasterID == 237) {
      //   let first_Slot = 0,
      //     second_Slot = 0;
      //   overtimeData.map((e) => {
      //     if (
      //       +e.UpdateOverTimeHourAndMin >= 30 &&
      //       +e.UpdateOverTimeHourAndMin < 60
      //     )
      //       first_Slot++;
      //     if (+e.UpdateOverTimeHourAndMin >= 60) second_Slot++;
      //   });

      //   overtimeAmount = +first_Slot * 25 + +second_Slot * 50;
      // }

      toAddOvertimeData.push({
        userMasterID: user.userMasterID,
        yyyymm: yearmonth,
        overtimehrs: userOvertime_Min,
        ratio: ratio,
        grossamount: Math.round(gross),
        dailyrate: Math.round(perday_gross),
        TotalAmount: Math.round(overtimeAmount),
        rateBy: rateBy,
        createBy: req.userDetails.userMasterId,
        createByIp: createByIp,
      });
    }

    await sequelize.transaction(async (t) => {
      await overTimeCalculationMain.bulkCreate(toAddOvertimeData, {
        transaction: t,
      });
    });

    res.status(200).json({
      status: 200,
      // data: Alluser,
      message: 'Overtime Calculated successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.editOvertimeCal = async (req, res, next) => {
  try {
    const { userMasterID, yyyymm, ratio = 0 } = req.body;

    const find_OT_Calculation = await overTimeCalculationMain.findOne({
      where: {
        userMasterID,
        yyyymm,
      },
    });

    if (!find_OT_Calculation)
      return res.status(200).json({
        status: 401,
        message: 'OT Calculation Not Found!',
      });

    let perminute_gross = 0;
    const month = String(yyyymm).slice(4, 6);
    const year = String(yyyymm).slice(0, 4);
    const monday = daysInMonth(month, year);

    const endDate = year + '-' + month + '-' + monday;

    const attendancePolicy = await employeeAttendancePolicy(
      userMasterID,
      endDate
    );

    if (
      find_OT_Calculation.rateBy == 'hourlybasic' ||
      find_OT_Calculation.rateBy == 'hourly' ||
      find_OT_Calculation.rateBy == 'fixedAmount'
    ) {
      perminute_gross = Number(find_OT_Calculation.dailyrate) / 60;
    } else {
      perminute_gross = getPerMinuteGross(
        +find_OT_Calculation.dailyrate,
        attendancePolicy ? attendancePolicy.overtimeHrs : 480
      );
    }

    const overtimeAmount = calculateOvertimeAmount(
      perminute_gross,
      find_OT_Calculation.overtimehrs,
      ratio
    );

    find_OT_Calculation.ratio = ratio;
    find_OT_Calculation.TotalAmount = Math.round(overtimeAmount);
    find_OT_Calculation.updateBy = req.userDetails.userMasterId;

    await find_OT_Calculation.save();

    return res.status(200).json({
      status: 200,
      message: 'Overtime Updated Successfully.',
      data: find_OT_Calculation,
    });
  } catch (error) {
    next(error);
  }
};

exports.getdataovertime = async (req, res, next) => {
  try {
    let { companyMasterID, branchMasterID, yearmonth, page, limit } =
      await req.body;

    let offset = (page - 1) * limit;

    let finaldata = [];

    let month = Number(yearmonth.slice(4, 6));
    let year = Number(yearmonth.slice(0, 4));
    let monday = daysInMonth(month, year);

    const endDate = year + '-' + month + '-' + monday;

    const Calculated_overtime = await overTimeCalculationMain.findAndCountAll({
      raw: true,
      where: {
        // userMasterID: user,
        yyyymm: yearmonth,
      },
      include: [
        {
          required: true,
          model: UserMaster,
          where: { companyMasterId: companyMasterID },
          attributes: ['displayName', 'userMasterID'],
          ...accessibleUsers(req.userDetails, false, false),
          include: [
            {
              model: EmployeeBranch,
              where: {
                ...(branchMasterID && { branchID: branchMasterID }),
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(endDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: branchMasterID ? true : false,
              attributes: ['branchID', 'applicableDate'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
          ],
        },
      ],
      offset: offset,
      limit: limit,
      order: [[Sequelize.literal(`"userMaster.displayName"`), 'ASC']],
    });

    const userCalculated_overtime = Calculated_overtime.rows;

    for (let i = 0; i < userCalculated_overtime.length; i++) {
      const userMasterID = userCalculated_overtime[i].userMasterID;

      const [user_salaryPolicy, salaryData] = await Promise.all([
        employeeSalaryPolicy(userMasterID, endDate),
        getUserSalaryMasterByMonth(userMasterID, yearmonth),
      ]);

      let start_date,
        end_date,
        monthDays = monday;

      if (user_salaryPolicy) {
        let date = user_salaryPolicy['salaryPolicy.salaryCycleDate'];

        date = (date < 10 ? '0' : '') + date;

        start_date = year + '-' + month + '-' + date;

        // To Check salary consider Month

        if (user_salaryPolicy['salaryPolicy.salaryCycleConsider'] == 'E') {
          const tempDate = new Date(start_date);
          tempDate.setMonth(tempDate.getMonth() - 1);

          start_date =
            tempDate.getFullYear() +
            '-' +
            String(tempDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(tempDate.getDate()).padStart(2, '0');

          // set Month days
          monthDays = daysInMonth(
            start_date.slice(5, 7),
            start_date.slice(0, 4)
          );
        }

        let date1 = new Date(start_date);
        date1.setDate(date1.getDate() + (monthDays - 1));

        end_date =
          date1.getFullYear() +
          '-' +
          String(date1.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date1.getDate()).padStart(2, '0');
      } else {
        start_date = year + '-' + (month < 10 ? '0' : '') + month + '-' + '01';
        end_date = year + '-' + (month < 10 ? '0' : '') + month + '-' + monday;
      }

      // overtime data

      const [approveOvertimeData, pendingcount] = await Promise.all([
        overTimeCalculation.findAll({
          where: {
            UserMasterID: userMasterID,
            OverTimeDate: {
              [Sequelize.Op.between]: [start_date, end_date],
            },
            AuthorizationRequired: 3,
          },
          attributes: [
            'OverTimeDate',
            'UpdateTimeInDateTime',
            'UpdateTimeOutDateTime',
            'UpdateOverTimeHourAndMin',
          ],
          order: [['OverTimeDate', 'ASC']],
        }),

        overTimeCalculation.count({
          where: {
            UserMasterID: userMasterID,
            OverTimeDate: {
              [Sequelize.Op.between]: [start_date, end_date],
            },
            AuthorizationRequired: [0, 1, 2],
          },
        }),
      ]);

      const perminute_gross =
        Number(userCalculated_overtime[i].TotalAmount) /
        (Number(userCalculated_overtime[i].overtimehrs) *
          Number(userCalculated_overtime[i].ratio));

      const rateBy = userCalculated_overtime[i].rateBy
        ? userCalculated_overtime[i].rateBy
        : '';

      finaldata.push({
        userMasterID: userMasterID,
        employeeName: userCalculated_overtime[i]['userMaster.displayName'],
        yearmonth: yearmonth,
        gross: userCalculated_overtime[i].grossamount,
        overtime_minutes: userCalculated_overtime[i].overtimehrs,
        perminute_gross: perminute_gross,
        dailyrate: userCalculated_overtime[i].dailyrate + ' ' + rateBy,
        ratio: userCalculated_overtime[i].ratio,
        totalAmount: userCalculated_overtime[i].TotalAmount,
        showpendingButton: +pendingcount > 0 ? 'Yes' : 'No',
        overtimeData: approveOvertimeData,
        startDate: start_date,
        endDate: end_date,
        paidinsalary: userCalculated_overtime[i].ReferenceId ? 'Yes' : 'No',
        netPay:
          salaryData.find((e) => e.payheadMasterId == 92)
            ?.EmployeeSalaryAmount || 0,
      });
    }

    res.status(200).json({
      status: 200,
      data: finaldata,
      totalcount: +Calculated_overtime.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPendingOvertimedata = async (req, res, next) => {
  try {
    const { userMasterID, startDate, endDate } = await req.body;

    let pendingOvertime = await overTimeCalculation.findAll({
      raw: true,
      where: {
        UserMasterID: userMasterID,
        OverTimeDate: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
        AuthorizationRequired: [0, 1, 2],
      },
      include: [
        {
          model: attendanceTransaction,
          attributes: ['InDatetime', 'OutDateTime'],
        },
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      order: [['OverTimeDate', 'ASC']],
    });

    for (let i = 0; i < pendingOvertime.length; i++) {
      const otrequest = await executeQuery(
        `
    
        select um."displayName",ota.authstatus from "overtimeAuthorizations" as ota left outer join 
        "userMasters" as um on ota."userMasterID" = um."userMasterID" where ota."ReferenceID"= ` +
          pendingOvertime[i].OverTimeID +
          `
      
      `
      );

      otrequest.map((e) => {
        e.authstatus =
          e.authstatus == 1
            ? 'Accepted'
            : e.authstatus == 0
              ? 'Rejected'
              : 'Pending';
      });

      pendingOvertime[i].auth = otrequest;

      const criteria = await AuthorizationDetails.findOne({
        raw: true,
        where: {
          userMasterID: pendingOvertime[i].UserMasterID,
          AuthorizationMasterID: authorizationMasterTypes.overtime,
          status: 1,
        },
        include: [
          {
            model: AuthorizationCriteriaMaster,
            attributes: ['AuthorizationCriteria'],
          },
        ],
        attributes: [],
      });

      pendingOvertime[i].criteria = criteria
        ? criteria['AuthorizationCriteriaMaster.AuthorizationCriteria']
        : '';
    }

    return res.status(200).json({
      status: 200,
      data: pendingOvertime,
    });
  } catch (err) {
    next(err);
  }
};

exports.getratiowiseovertime = async (req, res, next) => {
  try {
    let perminutewise = Number(req.body.perminute_gross);
    let min = Number(req.body.overtimemin);
    let ratio = Number(req.body.ratio);

    let amount = Math.round(
      Number(perminutewise) * Number(min) * Number(ratio)
    );

    let data = {
      amount,
    };

    res
      .status(200)
      .json({ status: 200, message: 'Data Get Successfully.', data: data });
  } catch (err) {
    next(err);
  }
};

exports.editovertimecal = async (req, res, next) => {
  try {
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await overTimeCalculationMain.update(
        {
          ratio: req.body.ratio,
          TotalAmount: req.body.totalamount,
          updateBy: req.body.updateBy,
          createByIp: req.body.createByIp,
        },
        {
          where: {
            userMasterID: req.body.userMasterID,
            yyyymm: req.body.yyyymm,
          },
          transaction: t,
        }
      );
    });

    res
      .status(200)
      .json({ status: 200, message: message.usermessage.overtimedataupdate });
  } catch (err) {
    next(err);
  }
};

exports.deleteovertimecal = async (req, res, next) => {
  try {
    const { userMasterID, yyyymm } = req.body;

    let result = await sequelize.transaction(async (t) => {
      let deleteOTCal = await overTimeCalculationMain.destroy({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterID,
          },
          yyyymm: yyyymm,
        },
        transaction: t,
      });
    });
    res
      .status(200)
      .json({ status: 200, message: message.usermessage.overtimedatadelete });
  } catch (err) {
    next(err);
  }
};

exports.getovertimereport = async (req, res, next) => {
  try {
    let { limit, page, yyyymm, companyMasterID, branchMasterID, Export } =
      await req.body;

    const month = Number(yyyymm.slice(4, 6));
    const year = Number(yyyymm.slice(0, 4));
    const monday = daysInMonth(month, year);

    const endDate = year + '-' + month + '-' + monday;
    const startDate = year + '-' + month + '-' + '01';

    const user = [];

    if (companyMasterID && !branchMasterID) {
      const userdata = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: endDate,
          },
          '$userMaster.companyMasterId$': companyMasterID,
          '$userMaster.status$': [0, 1],
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });
      // const userdata = await getAllUserByCompanyDateWise(
      //   companyMasterID,
      //   '',
      //   '',
      //   endDate
      // );

      userdata.rows.map((e) => {
        user.push(e.userMasterID);
      });
    } else if (companyMasterID && branchMasterID) {
      const get_branch_users = await EmployeeBranch.findAndCountAll({
        raw: true,
        where: {
          branchID: branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(endDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(endDate),
              },
            },
            {
              endDate: null,
            },
          ],
          status: 1,
        },
      });
      let allActiveUsersID = [];
      for (let userID of get_branch_users.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }

      const userdata = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(endDate),
          },
          userMasterID: allActiveUsersID,
          '$userMaster.status$': [0, 1],
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });
      // const userdata = await getAllUserByBranchDateWise(
      //   branchMasterID,
      //   '',
      //   '',
      //   endDate
      // );

      userdata.rows.map((e) => {
        user.push(e.userMasterID);
      });
    }

    const condition = {
      userMasterID: user,
      yyyymm: yyyymm,
    };

    let paginateCondition = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit: limit }
        : {}
      : {};

    const overtime_report = await overTimeCalculationMain.findAndCountAll({
      raw: true,
      where: condition,
      ...paginateCondition,
      include: [
        {
          model: UserMaster,
          attributes: ['displayName', 'userNumber'],
          include: [
            { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
          ],
        },
      ],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });

    if (Export == 'true') {
      if (overtime_report.rows.length === 0)
        return res.status(200).json({
          status: 401,
          message: 'No data fount to export!',
        });

      const data = overtime_report.rows.map((e) => {
        const row = {};
        row['Employee Code'] =
          e['userMaster.employeeJoiningDetails.employeeCode'];
        row['Employee Name'] = e['userMaster.displayName'];
        row['Employee Number'] = e['userMaster.userNumber'];
        row['Gross Income'] = e.grossamount;
        row['Overtime Minutes'] = e.overtimehrs;
        row['Rate'] = e.dailyrate + ' ' + e.rateBy;
        row['Ratio'] = e.ratio;
        row['Total Amount'] = e.TotalAmount;

        return row;
      });

      return await generateExcel(
        data,
        `Overtime Report - ${yyyymm}`,
        'xlsx',
        res
      );
    }

    return res.status(200).json({
      status: 200,
      data: overtime_report.rows,
      totalcount: +overtime_report.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getOvertimeDataUserwise = async (req, res, next) => {
  try {
    let { limit, page, fromdate, todate, userMasterID, Export } =
      await req.body;

    const year = fromdate.slice(0, 4);
    const month = fromdate.slice(5, 7);
    const yearmonth = year + month;

    const condition = {
      UserMasterID: userMasterID,
      AuthorizationRequired: 3,
      OverTimeDate: {
        [Sequelize.Op.between]: [new Date(fromdate), new Date(todate)],
      },
    };

    let paginateCondition = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit: limit }
        : {}
      : {};

    const overtime = await overTimeCalculation.findAndCountAll({
      raw: true,
      where: condition,
      ...paginateCondition,
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [
            { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
          ],
        },
        { model: attendanceTransaction },
      ],
      order: [['OverTimeDate', 'ASC']],
    });

    let overtimeData = overtime.rows;

    let totalminutes = overtimeData.reduce((acc, obj) => {
      return acc + Number(obj.UpdateOverTimeHourAndMin);
    }, 0);

    let final_totalhours = Math.trunc(Number(totalminutes) / 60);

    let final_totalminutes = Number(totalminutes) % 60;

    let overtime_Amount = await overTimeCalculationMain.findOne({
      where: {
        userMasterID: userMasterID,
        yyyymm: yearmonth,
      },
    });

    let finalAmount;

    if (overtime_Amount) {
      finalAmount = overtime_Amount.TotalAmount;
    } else {
      finalAmount = '';
    }

    for (let k = 0; k < overtimeData.length; k++) {
      let hour = Math.trunc(
        Number(overtimeData[k].UpdateOverTimeHourAndMin) / 60
      );
      let minutes = Number(overtimeData[k].UpdateOverTimeHourAndMin) % 60;

      if (Number(minutes) < 10) {
        minutes = '0' + minutes;
      }

      let hour_minute = hour + '.' + minutes;

      overtimeData[k].overtimehour = hour_minute;
      overtimeData[k].finalovertimehour = final_totalhours;
      overtimeData[k].finalovertimemin = final_totalminutes;
      overtimeData[k].overtimeAmount = finalAmount;
    }

    if (Export == 'true') {
      if (overtimeData.length === 0)
        return res.status(200).json({
          status: 401,
          message: 'No data found to export!',
        });

      const data = overtimeData.map((e) => {
        const row = {};
        row['Employee Code'] =
          e['userMaster.employeeJoiningDetails.employeeCode'];
        row['Employee Name'] = e['userMaster.displayName'];
        row['Employee Number'] = e['userMaster.userNumber'];
        row['Overtime Date'] = e.OverTimeDate;
        row['Overtime Hours'] = e.overtimehour;
        row['Overtime In'] = e.UpdateTimeInDateTime
          ? asiaKolkataDateTime(e.UpdateTimeInDateTime)
          : '';
        row['Overtime Out'] = e.UpdateTimeOutDateTime
          ? asiaKolkataDateTime(e.UpdateTimeOutDateTime)
          : '';
        row['PunchIn Time'] = e.attendanceTransaction
          ? e['attendanceTransaction.InDatetime']
            ? asiaKolkataDateTime(e['attendanceTransaction.InDatetime'])
            : ''
          : '';
        row['PunchOut Time'] = e.attendanceTransaction
          ? e['attendanceTransaction.OutDateTime']
            ? asiaKolkataDateTime(e['attendanceTransaction.OutDateTime'])
            : ''
          : '';

        return row;
      });

      return await generateExcel(
        data,
        `${data[0]['Employee Name']}`,
        'xlsx',
        res
      );
    }

    return res
      .status(200)
      .json({ status: 200, data: overtimeData, totalcount: +overtime.count });
  } catch (err) {
    next(err);
  }
};

exports.getConsolidateReport = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      branchMasterID,
      userMasterID,
      startDate,
      endDate,
      Export,
      page,
      limit,
    } = req.body;

    const finalData = [];
    let userids = [];
    let userdata;

    if (companyMasterID && !branchMasterID) {
      let startdate = startDate,
        enddate = endDate;
      const paginateCondition = {};
      // if (page && limit && Export != 'true') {
      //   paginateCondition.offset = (page - 1) * limit;
      //   paginateCondition.limit = limit;
      // }

      const userdata1 = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(startdate),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          '$userMaster.companyMasterId$': companyMasterID,
          '$userMaster.status$': [0, 1],
        },
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });
      // const userdata1 = await getUserByCompanyandDateRange(
      //   companyMasterID,
      //   '',
      //   '',
      //   startDate,
      //   endDate
      // );

      userdata = userdata1.rows;
    }

    if (branchMasterID) {
      let startdate = startDate,
        enddate = endDate;
      const get_branch_users = await EmployeeBranch.findAndCountAll({
        raw: true,
        where: {
          branchID: branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(startdate),
              },
            },
            {
              endDate: null,
            },
          ],
          status: 1,
        },
      });
      let allActiveUsersID = [];
      for (let userID of get_branch_users.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }
      const paginateCondition = {};
      if (page && limit) {
        paginateCondition.offset = (page - 1) * limit;
        paginateCondition.limit = limit;
      }

      const userdata1 = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(startdate),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          userMasterID: allActiveUsersID,
          '$userMaster.status$': [0, 1],
        },
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });

      userdata1.rows.forEach((row) => {
        const branchData = get_branch_users.rows.find(
          (user) => user.userMasterID === row.userMasterID
        );
        if (branchData) {
          row.branchStartDate = branchData.applicableDate;
          row.branchEndDate = branchData.endDate;
        }
      });
      // const userdata1 = await getUserByBranchandDateRange(
      //   branchMasterID,
      //   '',
      //   '',
      //   startDate,
      //   endDate
      // );

      userdata = userdata1.rows;
    }

    userdata.map((e) => {
      userids.push(e.userMasterID);
    });

    if (userMasterID && userMasterID.length > 0) userids = userMasterID;

    const active = [];
    const deactive = [];
    const left = [];

    for (let e of userids) {
      let startdate = startDate;
      let enddate = endDate;

      const data = {};

      const userdetails = userdata.find((user) => e == user.userMasterID);

      if (userdetails) {
        if (branchMasterID) {
          if (new Date(userdetails.branchStartDate) > new Date(startDate)) {
            startdate = new Date(userdetails.branchStartDate)
              .toISOString()
              .slice(0, 10);
          }

          if (
            userdetails.branchEndDate &&
            new Date(userdetails.branchEndDate) > new Date(startDate) &&
            new Date(userdetails.branchEndDate) < new Date(endDate)
          ) {
            enddate = new Date(userdetails.branchEndDate)
              .toISOString()
              .slice(0, 10);
          }
        } else {
          if (new Date(userdetails.joiningDate) > new Date(startDate)) {
            startdate = userdetails.joiningDate;
          }

          if (
            userdetails.leavingDate ||
            userdetails['userMaster.deactiveDate']
          ) {
            enddate = userdetails.leavingDate
              ? userdetails.leavingDate
              : userdetails['userMaster.deactiveDate'];
          }
        }

        const otamount = await overTimeCalculation.findAll({
          raw: true,
          attributes: [
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal('COALESCE("UpdateOverTimeHourAndMin", 0)')
              ),
              'totalOverTime',
            ],
          ],

          where: {
            UserMasterID: e,
            OverTimeDate: {
              [Sequelize.Op.between]: [startdate, enddate],
            },
            AuthorizationRequired: 3,
          },
        });

        if (otamount.length > 0) {
          if (otamount[0].totalOverTime) {
            data['Employee Code'] = userdetails.employeeCode;
            data['Employee Name'] = userdetails['userMaster.displayName'];
            data['Employee Number'] = userdetails['userMaster.userNumber'];

            if (branchMasterID) {
              const employeeBranch = await BranchMaster.findOne({
                where: {
                  branchMasterID: branchMasterID,
                },
                attributes: ['branchName'],
              });

              data['Branch'] = employeeBranch ? employeeBranch.branchName : '';
            } else {
              const userBranch = await employeeBranch(e, enddate);

              data['Branch'] = userBranch
                ? userBranch['branchMaster.branchName']
                : '';
            }

            const userDepartment = await employeeDepartment(e, enddate);

            data['Department'] = userDepartment
              ? userDepartment['department.departmentName']
              : '';

            const userDesig = await employeeDesignation(e, enddate);

            data['Designation'] = userDesig
              ? userDesig['designation.designationName']
              : '';

            data['Overtime From Date'] = startdate;
            data['Overtime To Date'] = enddate;

            data['Total Overtime (Minutes)'] = otamount[0].totalOverTime;
            data['Total Overtime (Hours)'] = (
              +otamount[0].totalOverTime / 60
            ).toFixed(2);

            if (userdetails.leavingDate) {
              left.push(data);
            } else if (userdetails['userMaster.deactiveDate']) {
              deactive.push(data);
            } else {
              active.push(data);
            }

            finalData.push(data);
          }
        }
      }
    }

    if (Export) {
      const data = [];
      const sheetNames = [];
      if (active.length > 0) {
        data.push(active);
        sheetNames.push('Active Employees');
      }
      if (deactive.length > 0) {
        data.push(deactive);
        sheetNames.push('Deactive Employees');
      }
      if (left.length > 0) {
        data.push(left);
        sheetNames.push('Left Employees');
      }

      if (+finalData.length == 0) {
        return res.status(200).json({
          message: 'No data found to export!',
        });
      } else {
        await generateChecklistExcel(
          data,
          'Consolidate_OT_Report',
          'xlsx',
          res,
          sheetNames
        );
        return;
      }
    }
    return;
  } catch (err) {
    next(err);
  }
};

exports.getDailyOTReport = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      companyMasterID,
      branchMasterID,
      userMasterID,
      startDate,
      endDate,
      authorizationStatus,
      Export,
    } = req.body;

    const reqAuthStatus = [];

    if (authorizationStatus && authorizationStatus.length > 0) {
      if (authorizationStatus.includes('Accepted')) reqAuthStatus.push(3);
      if (authorizationStatus.includes('Rejected')) reqAuthStatus.push(4);
      if (authorizationStatus.includes('Pending')) reqAuthStatus.push(0, 1, 2);
    }

    const paginationCondition = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};
    const condition = {
      OverTimeDate: {
        [Sequelize.Op.between]: [startDate, endDate],
      },
    };

    if (userMasterID && userMasterID.length > 0) {
      condition.UserMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };
    }

    if (reqAuthStatus && reqAuthStatus.length > 0) {
      condition.AuthorizationRequired = {
        [Sequelize.Op.in]: reqAuthStatus,
      };
    }

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const { rows: otData, count } = await overTimeCalculation.findAndCountAll({
      where: condition,
      ...paginationCondition,
      include: [
        {
          model: attendanceTransaction,
          attributes: ['InDatetime', 'OutDateTime'],
        },
        {
          model: UserMaster,
          attributes: ['displayName', 'userNumber', 'userMasterID'],
          required: true,
          where: { companyMasterId: companyMasterID },
          include: [
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              required: false,

              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              required: false,

              model: EmployeeBranch,
              where: {
                ...(branchMasterID && { branchID: branchMasterID }),
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: branchMasterID ? true : false,
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              required: false,

              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
      order: [
        [Sequelize.literal(`"userMaster.displayName"`), 'ASC'],
        ['OverTimeDate', 'ASC'],
      ],
    });

    const otIds = otData.map((e) => e.OverTimeID);
    const uniqueUserIds = Array.from(
      new Set(otData.map((item) => item.UserMasterID))
    );

    const [authorizationData, auth_Criterea] = await Promise.all([
      overtimeAuthorizationRequest.findAll({
        raw: true,
        where: {
          ReferenceID: {
            [Sequelize.Op.in]: otIds,
          },
        },
        include: [
          {
            model: UserMaster,
            as: 'authorizedPerson',
            attributes: ['displayName'],
          },
        ],
      }),
      AuthorizationDetails.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Sequelize.Op.in]: uniqueUserIds,
          },
          status: 1,
          AuthorizationMasterID: authorizationMasterTypes.overtime, // fot ot
        },
        include: [
          {
            model: AuthorizationCriteriaMaster,
            attributes: ['AuthorizationCriteria'],
          },
        ],
      }),
    ]);

    const final = await Promise.all(
      otData.map((e) => {
        const obj = {};

        obj['Employee Code'] =
          e.userMaster.employeeJoiningDetails &&
          e.userMaster.employeeJoiningDetails.length > 0
            ? e.userMaster.employeeJoiningDetails[0].employeeCode
            : '';
        obj['Employee Name'] = e.userMaster.displayName;
        obj['Mobile No.'] = e.userMaster.userNumber;
        obj['Branch'] =
          e.userMaster.employeeBranches &&
          e.userMaster.employeeBranches.length > 0
            ? e.userMaster.employeeBranches[0].branchMaster
              ? e.userMaster.employeeBranches[0].branchMaster.branchName
              : ''
            : '';
        obj['Department'] =
          e.userMaster.employeeDepartments &&
          e.userMaster.employeeDepartments.length > 0
            ? e.userMaster.employeeDepartments[0].department
              ? e.userMaster.employeeDepartments[0].department.departmentName
              : ''
            : '';
        obj['Designation'] =
          e.userMaster.employeeDesignations &&
          e.userMaster.employeeDesignations.length > 0
            ? e.userMaster.employeeDesignations[0].designation
              ? e.userMaster.employeeDesignations[0].designation.designationName
              : ''
            : '';

        obj['Overtime Date'] = String(e.OverTimeDate)
          .split('-')
          .reverse()
          .join('-');
        obj['PunchIn Time'] = e.attendanceTransaction
          ? toGetFormateddate(e.attendanceTransaction.InDatetime)
          : '';
        obj['PunchOut Time'] = e.attendanceTransaction
          ? toGetFormateddate(e.attendanceTransaction.OutDateTime)
          : '';

        if (e.AuthorizationRequired != 3) {
          obj['Overtime Start DateTime'] = e.OverTimeInDateTime
            ? toGetFormateddate(e.OverTimeInDateTime)
            : '';
          obj['Overtime End DateTime'] = e.OverTimeOutDateTime
            ? toGetFormateddate(e.OverTimeOutDateTime)
            : '';
          obj['Overtime Minutes'] = e.OverTimeHourAndMin;
        } else {
          obj['Overtime Start DateTime'] = e.UpdateTimeInDateTime
            ? toGetFormateddate(e.UpdateTimeInDateTime)
            : '';
          obj['Overtime End DateTime'] = e.UpdateTimeOutDateTime
            ? toGetFormateddate(e.UpdateTimeOutDateTime)
            : '';
          obj['Overtime Minutes'] = e.UpdateOverTimeHourAndMin;
        }

        obj['Status'] =
          e.AuthorizationRequired == 3
            ? 'Accepted'
            : e.AuthorizationRequired == 4
              ? 'Rejected'
              : 'Pending';

        const authdata = authorizationData.filter(
          (a) => a.ReferenceID == e.OverTimeID
        );

        obj['Authorization'] = authdata
          .map(
            (el) =>
              `${el['authorizedPerson.displayName']} - ${
                el.authstatus == 1
                  ? 'Accepted'
                  : el.authstatus == 0
                    ? 'Rejected'
                    : 'Pending'
              }`
          )
          .join(', ');

        const authCriteria = auth_Criterea.find(
          (c) => c.userMasterID == e.UserMasterID
        );

        obj['Authorization Criteria'] = authCriteria
          ? authCriteria['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';

        return obj;
      })
    );

    if (Export)
      return await generateExcel(final, 'Daily OT Report', 'xlsx', res);

    return res.status(200).json({
      status: 200,
      data: final,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};
