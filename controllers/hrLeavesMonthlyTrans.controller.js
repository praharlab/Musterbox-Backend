/** @format */

const Sequelize = require('sequelize');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const employeeJoiningDetails = require('../models/employeeJoiningDetails');
const employeeSalaryPolicies = require('../models/employeeSalaryPolicy');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const EmployeeWeekOff = require('../models/employeeWeekOff');
const WeekoffOptions = require('../models/weekOffOptions');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const employeeHolidayPolicy = require('../models/employeeHolidayPolicy');
const holidayList = require('../models/holidayList');
const { executeQuery } = require('./common.controller');
const UserMaster = require('../models/userMaster');

const hrLeaveTypes = require('../models/hrLeaveTypes');
const WeekOffHoliday = require('../models/weekoffHolidayTran');
const attendanceTransaction = require('../models/attendanceTransaction');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const UserLeave = require('../models/userleave');
const UserLeaveTransactions = require('../models/userLeaveTransaction');
const SalaryPolicy = require('../models/salaryPolicy');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeDepart = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const Designation = require('../models/designation');

const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const AttendancePolicy = require('../models/attendancePolicy');
const OvertimeAuthorizationRequest = require('../models/overtimeAuthorization');
const overTimeCalculation = require('../models/overTimeCalculation');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const overtimeAuthorizationRequest = require('../models/overtimeAuthorization');
const ShiftTIme = require('../models/shiftTime');
const UserLeaveTransaction = require('../models/userLeaveTransaction');
const moment = require('moment');
const Shift = require('../models/shift');
const HRSalarySlip = require('../models/hrSalarySlip');
const HRSalaryMasterFields = require('../models/hrSalaryMaster');
const overTimeCalculationMain = require('../models/overTimeCalculationMain');
const EmployeeAttendanceBonusPolicy = require('../models/empattandancebonuspolicy');
const AttendanceBonusPolicy = require('../models/attendanceBonusPolicy');
const Incentivetype = require('../models/incentivetype');
const {
  accessibleUsers,
  calculateDays,
  attendanceCalculation1,
  checkLeaveOnWH,
  getDaysFromDates,
  asiaKolkataDateTime,
  employeeLateEarlyPolicy,
  getStartAndEndDate,
} = require('../utils/commonUtilFunctions');

const {
  daysInMonth,
  employeeAttendancePolicy,
  employeeDepartment,
  employeeDesignation,
  employeeBranch,
  employeeSalaryPolicy,
  paginate,
  getAllUserByCompanyDateWise,
  getAllUserByBranchDateWise,
  getUserByCompanyandDateRange,
  getUserByBranchandDateRange,
  toGetFinalHolidayWeekoff,
  getSundaysBetweenDates,
  lunchBreakPenaltyForVaishnavi,
  checkSundayPresentDoublesalary,
  addThreeDaysExtraAmount,
  getOTDaysforAsopalav,
  getAttendanceData,
  getSalaryData,
  getUserSalaryMasterByMonth,
  month_dict,
  userDetails,
  employeeShift,
} = require('../utils/commonUtilFunctions');

const { generateExcel } = require('../utils/exportData');
const ExtraDays = require('../models/extraDays');

/*
 * @body {createBy} user id of user who added the hr leave monthly transaction
 */

/*
 * return all hr leaves monthly transactions
 */

async function getdates(weekoffid, yearMonth, UserMasterID) {
  let alldata = [];
  alldata = await WeekoffOptions.findAll({
    where: {
      weekOffPolicyID: weekoffid,
    },
    include: [{ all: true, nested: true }],
  });
  function Value(option) {
    if (option.slice(0, 4) == 'full') {
      return 1;
    } else {
      return 0.5;
    }
  }

  function getDate(year, month, day) {
    var start_date = new Date(year, month - 1, 2);
    var end_date = new Date(year, month, 0).getDate();
    var day_date = new Array();
    var day_val;
    if (day == 'sunday') {
      day_val = 0;
    } else if (day == 'monday') {
      day_val = 1;
    } else if (day == 'tuesday') {
      day_val = 2;
    } else if (day == 'wednesday') {
      day_val = 3;
    } else if (day == 'thursday') {
      day_val = 4;
    } else if (day == 'friday') {
      day_val = 5;
    } else {
      day_val = 6;
    }

    for (var i = 1; i <= end_date; i++) {
      var newDate = new Date(
        start_date.getFullYear(),
        start_date.getMonth(),
        i
      );
      if (newDate.getDay() == day_val) {
        day_date.push(i);
      }
    }
    return day_date;
  }
  var arr = [];

  if (alldata.length > 0) {
    for (var i = 0; i < alldata.length; i++) {
      for (j = 0; j < alldata[i].dataValues.options.length; j++) {
        var value = Value(alldata[i].dataValues.options[j].option);
        var temp_date;
        var day = alldata[i].day;
        var year = String(yearMonth).slice(0, 4);
        var month = String(yearMonth).slice(4, 6);
        var day_option = alldata[i].dataValues.options[j].name.slice(0, 3);

        if (day_option != 'all') {
          if (day_option == '1st') {
            temp_date = getDate(year, month, day)[0];
          } else if (day_option == '2nd') {
            temp_date = getDate(year, month, day)[1];
          } else if (day_option == '3rd') {
            temp_date = getDate(year, month, day)[2];
          } else if (day_option == '4th') {
            temp_date = getDate(year, month, day)[3];
          } else if (day_option == '5th') {
            temp_date = getDate(year, month, day)[4];
          } else {
            temp_date = null;
          }
          if (temp_date != null) {
            let temp = {
              companyMasterID:
                alldata[i].weekOffPolicy.dataValues.companyMasterID,
              userMasterID: UserMasterID,
              yearMonth: yearMonth,
              date: new Date(
                new Date(year, month - 1, temp_date).getTime() + 330 * 60000
              )
                .toISOString()
                .split('T')[0],
              dayName: alldata[i].day,
              value: value,
              tableName: 'weekoff',
            };
            arr.push(temp);
          }
        } else {
          for (k = 0; getDate(year, month, day)[k] != null; k++) {
            temp_date = getDate(year, month, day)[k];
            let temp = {
              companyMasterID:
                alldata[i].weekOffPolicy.dataValues.companyMasterID,
              userMasterID: UserMasterID,
              yearMonth: yearMonth,
              date: new Date(
                new Date(year, month - 1, temp_date).getTime() + 330 * 60000
              )
                .toISOString()
                .split('T')[0],
              dayName: alldata[i].day,
              value: value,
              tableName: 'weekoff',
            };
            arr.push(temp);
          }
        }
      }
    }
  }
  return arr;
}

async function getdates1(weekoffid, startdate, enddate, UserMasterID) {
  let alldata = [];
  alldata = await WeekoffOptions.findAll({
    where: {
      weekOffPolicyID: weekoffid,
    },
    include: [{ all: true, nested: true }],
  });
  function Value(option) {
    if (option.slice(0, 4) == 'full') {
      return 1;
    } else {
      return 0.5;
    }
  }

  function getDate(start_date, end_date, day0) {
    let start_year = start_date.slice(0, 4);
    let start_month = start_date.slice(5, 7);
    let start_day = start_date.slice(8, 10);

    let end_year = end_date.slice(0, 4);
    let end_month = end_date.slice(5, 7);
    let end_day = end_date.slice(8, 10);

    var end_date = new Date(start_year, start_month, 0).getDate();
    var day_date = new Array();
    var day_val;
    if (day0 == 'sunday') {
      day_val = 0;
    } else if (day0 == 'monday') {
      day_val = 1;
    } else if (day0 == 'tuesday') {
      day_val = 2;
    } else if (day0 == 'wednesday') {
      day_val = 3;
    } else if (day0 == 'thursday') {
      day_val = 4;
    } else if (day0 == 'friday') {
      day_val = 5;
    } else {
      day_val = 6;
    }

    for (var i = start_day - 1; i <= end_date; i++) {
      if (i != end_date) {
        var newDate = new Date(start_year, start_month - 1, i + 1);

        if (newDate.getDay() == day_val) {
          day_date.push(start_year + '-' + start_month + '-' + (i + 1));
        }
      } else {
        for (var j = 0; j < end_day; j++) {
          var newDate = new Date(end_year, end_month - 1, j + 1);

          if (newDate.getDay() == day_val) {
            //  day_date.push(j+1)
            day_date.push(end_year + '-' + end_month + '-' + (j + 1));
          }
        }
      }
    }
    return day_date;
  }
  var arr = [];

  if (alldata.length > 0) {
    for (var i = 0; i < alldata.length; i++) {
      for (j = 0; j < alldata[i].dataValues.options.length; j++) {
        var value = Value(alldata[i].dataValues.options[j].option);
        var temp_date;
        var day = alldata[i].day;
        var year = String(startdate).slice(0, 4);
        var month = String(startdate).slice(5, 7);
        let yearMonth = year + month;
        var day_option = alldata[i].dataValues.options[j].name.slice(0, 3);

        if (day_option != 'all') {
          if (day_option == '1st') {
            temp_date = getDate(startdate, enddate, day)[0];
          } else if (day_option == '2nd') {
            temp_date = getDate(startdate, enddate, day)[1];
          } else if (day_option == '3rd') {
            temp_date = getDate(startdate, enddate, day)[2];
          } else if (day_option == '4th') {
            temp_date = getDate(startdate, enddate, day)[3];
          } else if (day_option == '5th') {
            temp_date = getDate(startdate, enddate, day)[4];
          } else {
            temp_date = null;
          }

          if (temp_date != null) {
            let Year = temp_date.slice(0, 4);
            let Month = temp_date.slice(5, 7);
            let monthyear = Year + Month;
            let temp = {
              companyMasterID:
                alldata[i].weekOffPolicy.dataValues.companyMasterID,
              userMasterID: UserMasterID,
              yearMonth: monthyear,
              date: new Date(new Date(temp_date).getTime() + 330 * 60000)
                .toISOString()
                .split('T')[0],
              dayName: alldata[i].day,
              value: value,
              tableName: 'weekoff',
            };
            arr.push(temp);
          }
        } else {
          for (k = 0; getDate(startdate, enddate, day)[k] != null; k++) {
            temp_date = getDate(startdate, enddate, day)[k];
            let Year = temp_date.slice(0, 4);
            let Month = temp_date.slice(5, 7);
            let monthyear = Year + Month;
            let temp = {
              companyMasterID:
                alldata[i].weekOffPolicy.dataValues.companyMasterID,
              userMasterID: UserMasterID,
              yearMonth: monthyear,
              date: new Date(new Date(temp_date).getTime() + 330 * 60000)
                .toISOString()
                .split('T')[0],
              dayName: alldata[i].day,
              value: value,
              tableName: 'weekoff',
            };
            arr.push(temp);
          }
        }
      }
    }
  }
  return arr;
}

async function getdatesholiday1(holidayid, startdate, enddate, UserMasterID) {
  var arr = [];
  let alldata = [];
  alldata = await holidayList.findAll({
    where: {
      holidayPolicyID: holidayid,
    },
    include: [{ all: true, nested: true }],
    order: [],
  });

  function get_day(date) {
    temp = date.getDay();
    days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[temp];
  }
  var arr = [];
  for (var j = 0; j < alldata.length; j++) {
    for (var i = 0; i < alldata[j].holidayDate.length; i++) {
      let holidayday_date = moment(alldata[j].holidayDate[i])
        .tz('Asia/Kolkata')
        .format('YYYY-MM-DD');

      // let holidayday_date = new Date(alldata[j].holidayDate[i]).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }).format('YYYY-MM-DD')

      // let holidayday_date = new Date(alldata[j].holidayDate[i].getTime() + 1000 * (60 * 330))
      //   .toISOString()
      //   .slice(0, 10)

      if (
        new Date(startdate) <= new Date(holidayday_date) &&
        new Date(enddate) >= new Date(holidayday_date)
      ) {
        let temp = {
          companyMasterID: alldata[j].holidayPolicy.dataValues.companyMasterID,
          userMasterID: UserMasterID,
          yearMonth: Number(
            new Date(alldata[j].holidayDate[i].getTime() + 1000 * (60 * 330))
              .toISOString()
              .slice(0, 10)
              .slice(0, 4) +
              new Date(alldata[j].holidayDate[i].getTime() + 1000 * (60 * 330))
                .toISOString()
                .slice(0, 10)
                .slice(5, 7)
          ),
          date: new Date(
            alldata[j].holidayDate[i].getTime() + 1000 * (60 * 330)
          )
            .toISOString()
            .slice(0, 10),
          dayName: get_day(alldata[j].holidayDate[i]),
          value: 1,
          tableName: 'holiday',
        };
        arr.push(temp);
      }
    }
  }
  return arr;
}

async function getdatesholiday(holidayid, yearMonth, UserMasterID) {
  var arr = [];
  let alldata = [];
  alldata = await holidayList.findAll({
    where: {
      holidayPolicyID: holidayid,
    },
    include: [{ all: true, nested: true }],
  });

  function get_day(date) {
    temp = date.getDay();
    days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[temp];
  }
  var arr = [];
  for (var j = 0; j < alldata.length; j++) {
    for (var i = 0; i < alldata[j].holidayDate.length; i++) {
      let temp = {
        companyMasterID: alldata[j].holidayPolicy.dataValues.companyMasterID,
        userMasterID: UserMasterID,
        yearMonth: Number(
          new Date(alldata[j].holidayDate[i].getTime() + 1000 * (60 * 330))
            .toISOString()
            .slice(0, 10)
            .slice(0, 4) +
            new Date(alldata[j].holidayDate[i].getTime() + 1000 * (60 * 330))
              .toISOString()
              .slice(0, 10)
              .slice(5, 7)
        ),
        date: new Date(alldata[j].holidayDate[i].getTime() + 1000 * (60 * 330))
          .toISOString()
          .slice(0, 10),
        dayName: get_day(alldata[j].holidayDate[i]),
        value: 1,
        tableName: 'holiday',
      };
      arr.push(temp);
    }
  }
  return arr;
}

exports.getAllHrLeavesMonthlyTrans = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let hr_leaves_monthly_trans = [];
    if (limit == '' && page == '') {
      hr_leaves_monthly_trans = await HrLeaveMonthlyTrans.findAll({
        order: [['createdAt', 'ASC']],
      });
    } else {
      hr_leaves_monthly_trans = await HrLeaveMonthlyTrans.findAll({
        limit: limit,
        offset: offset,
        order: [['createdAt', 'ASC']],
      });
    }
    const totalcount = await HrLeaveMonthlyTrans.count({
      raw: true,
    });
    res.status(200).json({
      status: 200,
      data: hr_leaves_monthly_trans,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

async function overtimeauthorizationForAsopalav(data) {
  let authorizationmaster = await AuthorizationMaster.findOne({
    where: { authorizationMasterName: 'Overtime' },
  });
  let authorizationdetails = await AuthorizationDetails.findOne({
    where: {
      AuthorizationMasterID: authorizationmaster.authorizationMasterID,
      userMasterID: data.UserMasterID,
      status: 1,
    },
    raw: true,
  });

  let find_overtime = await overTimeCalculation.findOne({
    where: {
      UserMasterID: data.UserMasterID,
      OverTimeDate: data.OverTimeDate,
      AttendanceTransID: null,
    },
  });

  if (find_overtime) {
    await sequelize.transaction(async (t) => {
      let db_status = await overTimeCalculation.update(
        {
          OverTimeIn: data.OverTimeIn,
          OverTimeOut: data.OverTimeOut,
          OverTimeHourAndMin: Math.round(+data.OverTimeHourAndMin),
        },
        {
          where: {
            UserMasterID: data.UserMasterID,
            OverTimeDate: data.OverTimeDate,
          },
          transaction: t,
        }
      );
    });
  } else {
    if (authorizationdetails) {
      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });

      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        let result = await sequelize.transaction(async (t) => {
          let db_status = await overTimeCalculation.create(
            {
              AttendanceTransID: data.AttendanceTransID,
              UserMasterID: data.UserMasterID,
              OverTimeDate: data.OverTimeDate,
              OverTimeIn: data.OverTimeIn,
              OverTimeOut: data.OverTimeOut,
              OverTimeHourAndMin: Math.round(+data.OverTimeHourAndMin),
              AttendancePolicyID: data.AttendancePolicyID,
              AuthorizationRequired: 2,
              CompanyMasterID: data.CompanyMasterID,
              createBy: data.createBy,
              createByIp: data.createByIp,
            },
            { transaction: t }
          );
          let insert_db_status1 = await OvertimeAuthorizationRequest.create(
            {
              ReferenceID: db_status.OverTimeID,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
              status: 1,
              authstatus: 2,
              createBy: data.createBy,
              createByIp: data.createByIp,
            },
            { transaction: t }
          );

          return db_status;
        });
      } else {
        let result = await sequelize.transaction(async (t) => {
          let db_status = await overTimeCalculation.create(
            {
              AttendanceTransID: data.AttendanceTransID,
              UserMasterID: data.UserMasterID,
              OverTimeDate: data.OverTimeDate,
              OverTimeIn: data.OverTimeIn,
              OverTimeOut: data.OverTimeOut,
              OverTimeHourAndMin: Math.round(+data.OverTimeHourAndMin),
              AttendancePolicyID: data.AttendancePolicyID,
              CompanyMasterID: data.CompanyMasterID,
              AuthorizationRequired: 1,
              createBy: data.createBy,
              createByIp: data.createByIp,
            },
            { transaction: t }
          );

          for (
            var i = 0;
            i < authorizationdetails.AuthorizedByUserMasterId.length;
            i++
          ) {
            let insert_db_status1 = await OvertimeAuthorizationRequest.create(
              {
                ReferenceID: db_status.OverTimeID,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[i],
                status: 1,
                authstatus: 2,
                createBy: data.createBy,
                createByIp: data.createByIp,
              },
              { transaction: t }
            );
          }
        });
      }
    } else {
      let result = await sequelize.transaction(async (t) => {
        let db_status = await overTimeCalculation.create(
          {
            AttendanceTransID: data.AttendanceTransID,
            UserMasterID: data.UserMasterID,
            OverTimeDate: data.OverTimeDate,
            OverTimeIn: data.OverTimeIn,
            OverTimeOut: data.OverTimeOut,
            AuthorizationRequired: 0,
            OverTimeHourAndMin: Math.round(+data.OverTimeHourAndMin),
            AttendancePolicyID: data.AttendancePolicyID,
            CompanyMasterID: data.CompanyMasterID,
            createBy: data.createBy,
            createByIp: data.createByIp,
          },
          { transaction: t }
        );

        return db_status;
      });
    }
  }
}

/*
 * to add the hr leave monthly transaction to database
 */
exports.postAddHrLeavesMonthlyTrans = async (req, res, next) => {
  try {
    // let = {
    //   userMasterID,
    //   LeaveTranId,
    //   AttnYearMon,
    //   MonDays,
    //   MonWorkDays,
    //   AttnVal,
    //   createBy,
    //   createByIp,
    // } = await req.body;

    await sequelize.transaction(async (t) => {
      // let insert_db_status = await HrLeaveMonthlyTrans.create(
      //   {
      //     userMasterID,
      //     LeaveTranId,
      //     AttnYearMon,
      //     MonDays,
      //     MonWorkDays,
      //     AttnVal,
      //     createBy,
      //     createByIp,
      //   },
      //   { transaction: t }
      // );
      let insert_db_status = await HrLeaveMonthlyTrans.bulkCreate(req.body, {
        returning: true,
        transaction: t,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.AddHrLeavesMonthlyTrans,
        data: insert_db_status,
      });
    });
  } catch (err) {
    next(err);
  }
};

/*
 *to delete data by AttnTranId
 *@param {AttnTranId} to find data present at that id and delete it
 */
exports.postDeleteHrLeavesMonthlyTrans = async (req, res, next) => {
  try {
    let = { userMasterID, AttnYearMon } = await req.body;
    let delete_status = await HrLeaveMonthlyTrans.destroy({
      where: {
        userMasterID: userMasterID,
        AttnYearMon: AttnYearMon,
      },
    });

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.DeleteHrLeavesMonthlyTrans,
      });
    } else {
      res.status(200).json({
        status: 404,
        data: message.usermessage.hrleavemonthtransnotfound,
      });
    }
  } catch (err) {
    next(err);
  }
};

/*
 *get the data by  {userMasterId}
 */
exports.getHrLeavesMonthlyTransbyUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await HrLeaveMonthlyTrans.findOne({
      where: {
        userMasterID: req.params.id,
      },
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/*
 *get the data by  {LeaveTranId}
 */
exports.getHrLeavesMonthlyTransbyLeaveTranId = async (req, res, next) => {
  try {
    let get_one_data = await HrLeaveMonthlyTrans.findOne({
      where: {
        LeaveTranId: req.params.id,
      },
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

exports.getAttendanceValue = async (req, res, next) => {
  try {
    let = { companyMasterID, YearMM, limit, page, searchQuery, branch, user } =
      req.body;

    let results = [];
    let totalcount;
    let offset = (page - 1) * limit;

    if (branch == '' && user == '') {
      let usermaster = await executeQuery(
        ` select A.* from (
        select "userMasterID","userNumber","displayName",COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
        from "userMasters" as um 
        where status=1 and "companyMasterId"=` +
          companyMasterID +
          ` ) as A LIMIT ` +
          limit +
          ` OFFSET ` +
          offset +
          ``
      );

      for (var i = 0; i < usermaster.length; i++) {
        let alldata = await executeQuery(
          `select * from public.ms_fun_gethrleavemonthlytrans(` +
            companyMasterID +
            `,` +
            YearMM +
            `,` +
            usermaster[i].userMasterID +
            `)`
        );

        results = results.concat(alldata);
      }

      totalcount = await executeQuery(
        ` select count(A.*) from (
        select "userMasterID","userNumber","displayName",COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
        from "userMasters" as um 
        where status=1 and "companyMasterId"=` +
          companyMasterID +
          ` ) as A`
      );
      totalcount = Number(totalcount[0].count);
    } else if (branch != '' && user == '') {
      let usermaster = await executeQuery(
        ` select A.* from (
        select "userMasterID","userNumber","displayName",COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
        from "userMasters" as um 
        where status=1 and "companyMasterId"=` +
          companyMasterID +
          ` ) as A where A."branchID" IN (` +
          branch +
          `) LIMIT ` +
          limit +
          ` OFFSET ` +
          offset +
          ``
      );
      for (var i = 0; i < usermaster.length; i++) {
        let alldata = await executeQuery(
          `select * from public.ms_fun_gethrleavemonthlytrans(` +
            companyMasterID +
            `,` +
            YearMM +
            `,` +
            usermaster[i].userMasterID +
            `)`
        );
        results = results.concat(alldata);
      }

      totalcount = await executeQuery(
        ` select count(A.*) from (
        select "userMasterID","userNumber","displayName",COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
        from "userMasters" as um 
        where status=1 and "companyMasterId"=` +
          companyMasterID +
          ` ) as A where A."branchID" IN (` +
          branch +
          `) `
      );
      totalcount = Number(totalcount[0].count);
    } else if (branch == '' && user != '') {
      let usermaster = await executeQuery(
        ` select A.* from (
        select "userMasterID","userNumber","displayName",COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
        from "userMasters" as um 
        where status=1 and "companyMasterId"=` +
          companyMasterID +
          ` ) as A where A."userMasterID" IN (` +
          user +
          `) LIMIT ` +
          limit +
          ` OFFSET ` +
          offset +
          ``
      );
      for (var i = 0; i < usermaster.length; i++) {
        let alldata = await executeQuery(
          `select * from public.ms_fun_gethrleavemonthlytrans(` +
            companyMasterID +
            `,` +
            YearMM +
            `,` +
            usermaster[i].userMasterID +
            `)`
        );
        results = results.concat(alldata);
      }

      totalcount = await executeQuery(
        ` select count(A.*) from (
        select "userMasterID","userNumber","displayName",COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
        from "userMasters" as um 
        where status=1 and "companyMasterId"=` +
          companyMasterID +
          ` ) as A where A."userMasterID" IN (` +
          user +
          `)`
      );
      totalcount = Number(totalcount[0].count);
    } else {
      let usermaster = await executeQuery(
        ` select A.* from ( select "userMasterID","userNumber","displayName",COALESCE((select "departmentID" from "attendanceTransactions" where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart", COALESCE((select "branchID" from "attendanceTransactions" where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID" ,COALESCE((select "designationID"  from "attendanceTransactions" where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" from "userMasters" as um where status=1 and "companyMasterId"=` +
          companyMasterID +
          ` ) as A where A."userMasterID" IN (` +
          user +
          `) and A."branchID" IN (` +
          branch +
          `) LIMIT ` +
          limit +
          ` OFFSET ` +
          offset +
          ``
      );
      for (var i = 0; i < usermaster.length; i++) {
        let alldata = await executeQuery(
          `select * from public.ms_fun_gethrleavemonthlytrans(` +
            companyMasterID +
            `,` +
            YearMM +
            `,` +
            usermaster[i].userMasterID +
            `)`
        );
        results = results.concat(alldata);
      }

      totalcount = await executeQuery(
        ` select count(A.*) from (
        select "userMasterID","userNumber","displayName",COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=um."userMasterID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
        from "userMasters" as um 
        where status=1 and "companyMasterId"=` +
          companyMasterID +
          ` ) as A where A."userMasterID" IN (` +
          user +
          `) and A."branchID" IN (` +
          branch +
          `)`
      );
      totalcount = Number(totalcount[0].count);
    }

    //  results=await sequelize.query(`select * from public.ms_fun_gethrleavemonthlytrans(`+companyMasterID+`,`+YearMM+`) LIMIT `+limit+` OFFSET `+offset)
    var finalresp = [];

    if (results != undefined && results.length != 0) {
      var unique = [],
        uid;
      for (const element of results) {
        var get_one_data = await HrLeaveMonthlyTrans.findOne({
          where: {
            userMasterID: element.usermasterid,
            LeaveTranId: element.leavetranid,
            AttnYearMon: element.attnyearmon,
          },
        });
        if (get_one_data == null) {
          let userMasterID = element.usermasterid;
          let LeaveTranId = element.leavetranid;
          let AttnYearMon = element.attnyearmon;
          let MonDays = element.mondays;
          let MonWorkDays = element.monworkdays;
          let AttnVal = element.attnval == null ? 0 : element.attnval;
          let createBy = 1;
          let createByIp = '194.233.67.136';
          var insert_db_status = await HrLeaveMonthlyTrans.create({
            userMasterID,
            LeaveTranId,
            AttnYearMon,
            MonDays,
            MonWorkDays,
            AttnVal,
            createBy,
            createByIp,
          });
        } else {
          let userMasterID = element.usermasterid;
          let LeaveTranId = element.leavetranid;
          let AttnYearMon = element.attnyearmon;
          let MonDays = element.mondays;
          let MonWorkDays = element.monworkdays;
          let AttnVal = element.attnval == null ? 0 : element.attnval;
          let updateBy = 1;
          let updateByIp = '194.233.67.136';
          // var insert_db_status = await HrLeaveMonthlyTrans.update(
          //   {
          //     userMasterID,
          //     LeaveTranId,
          //     AttnYearMon,
          //     MonDays,
          //     MonWorkDays,
          //     AttnVal,
          //     updateBy,
          //     updateByIp,
          //   },
          //   {
          //     where: { AttnTranId: get_one_data.AttnTranId },
          //   },
          // )
        }
      }

      results.forEach((element) => {
        if (uid != element.usermasterid) {
          unique.push(element);
          uid = element.usermasterid;
        }
      });

      unique.forEach((element) => {
        let empdata = results.filter(
          (r1) => r1.usermasterid == element.usermasterid
        );
        if (empdata.length != 0) {
          let leavename = [];
          empdata.forEach((element) => {
            let arr = [];
            for (var key in element) {
              if (key == 'leavename') {
                arr.push(element[key]);
              }
              if (key == 'attnval') {
                arr.push(element[key]);
              }
              if (arr.length == 2) {
                leavename.push({
                  ltype: arr[0],
                  bal: arr[1],
                });
                arr = [];
              }
            }
          });

          var newJson = {
            UserMasterID: empdata[0].usermasterid,
            EmployeeName: empdata[0].employeename,
            YearMM: empdata[0].attnyearmon,
            MonthDays: empdata[0].mondays,
            WorkingDays: empdata[0].monworkdays,
            FromDate: empdata[0].fromdate,
            ToDate: empdata[0].todate,
            LeaveTypes: leavename,
          };

          // leavename.forEach((el, ind) => {
          //   el.val = el.bal
          //   let key = el.ltype
          //   newJson[key] = el.val
          // })
          finalresp.push(newJson);
        }
      });
      for (var m = 0; m < finalresp.length; m++) {
        let data = await HRSalaryTrasaction.count({
          where: {
            userMasterID: finalresp[m].UserMasterID,
            salaryYYYYMM: finalresp[m].YearMM,
          },
        });
        let yearMonth = finalresp[m].YearMM;
        if (data > 0) {
          finalresp[m].SalaryDone = 'Y';
        } else {
          finalresp[m].SalaryDone = 'N';
        }
        let employeeweekoff = await EmployeeWeekOff.findAll({
          where: {
            [Sequelize.Op.and]: [
              sequelize.fn(
                'EXTRACT(MONTH from "applicableDate") =',
                Number(YearMM.slice(4, 6))
              ),
              sequelize.fn(
                'EXTRACT(YEAR from "applicableDate") =',
                Number(YearMM.slice(0, 4))
              ),
            ],
            userMasterID: finalresp[m].UserMasterID,
            status: 1,
          },
          order: [['applicableDate', 'ASC']],
        });
        let maindatedata = [];
        if (employeeweekoff.length > 0) {
          for (var i = 0; i < employeeweekoff.length; i++) {
            var enddate = employeeweekoff[i].endDate;

            let dates = await getdates(
              employeeweekoff[i].weekOffPolicyID,
              yearMonth,
              finalresp[m].UserMasterID
            );
            if (enddate != null && enddate != '') {
              let data = dates.filter((item) => {
                return (
                  new Date(employeeweekoff[i].endDate) >= new Date(item.date) &&
                  new Date(employeeweekoff[i].applicableDate) <=
                    new Date(item.date)
                );
              });

              data.forEach((item, index) => {
                maindatedata.push(item);
              });
            } else {
              let data1 = dates.filter((item) => {
                return (
                  new Date(employeeweekoff[i].applicableDate) <=
                  new Date(item.date)
                );
              });

              data1.forEach((item, index) => {
                maindatedata.push(item);
              });
            }
          }
        } else {
          let employeeweekoff1 = await EmployeeWeekOff.findOne({
            where: { userMasterID: finalresp[m].UserMasterID, status: 1 },
            order: [['applicableDate', 'DESC']],
          });
          if (employeeweekoff1) {
            let dates2 = await getdates(
              employeeweekoff1.weekOffPolicyID,
              yearMonth,
              finalresp[m].UserMasterID
            );

            dates2.forEach((item, index) => {
              maindatedata.push(item);
            });
          }
        }

        let employeeholiday = await employeeHolidayPolicy.findAll({
          where: {
            [Sequelize.Op.and]: [
              sequelize.fn(
                'EXTRACT(MONTH from "applicableDate") =',
                Number(YearMM.slice(4, 6))
              ),
              sequelize.fn(
                'EXTRACT(YEAR from "applicableDate") =',
                Number(YearMM.slice(0, 4))
              ),
            ],
            userMasterID: finalresp[m].UserMasterID,
          },
          order: [['applicableDate', 'ASC']],
        });
        let maindatedata1 = [];
        if (employeeholiday.length > 0) {
          for (var i = 0; i < employeeholiday.length; i++) {
            var enddate = employeeholiday[i].endDate;

            let dates = await getdatesholiday(
              employeeholiday[i].holidayPolicyID,
              yearMonth,
              finalresp[m].UserMasterID
            );
            if (enddate != null && enddate != '') {
              let data = dates.filter((item) => {
                return (
                  new Date(employeeholiday[i].endDate) >= new Date(item.date) &&
                  new Date(employeeholiday[i].applicableDate) <=
                    new Date(item.date)
                );
              });

              data.forEach((item, index) => {
                maindatedata1.push(item);
              });
            } else {
              let data1 = dates.filter((item) => {
                return (
                  new Date(employeeholiday[i].applicableDate) <=
                  new Date(item.date)
                );
              });

              data1.forEach((item, index) => {
                maindatedata1.push(item);
              });
            }
          }
        } else {
          let employeeholiday1 = await employeeHolidayPolicy.findOne({
            where: { userMasterID: finalresp[m].UserMasterID, status: 1 },
            order: [['applicableDate', 'DESC']],
          });

          if (employeeholiday1) {
            let dates2 = await getdates(
              employeeholiday1.holidayPolicyID,
              yearMonth,
              finalresp[m].UserMasterID
            );

            dates2.forEach((item, index) => {
              maindatedata1.push(item);
            });
          }
        }

        let merge = maindatedata.concat(maindatedata1);

        function getUniqueListBy(arr, key) {
          return [...new Map(arr.map((item) => [item[key], item])).values()];
        }
        const insertdata = getUniqueListBy(merge, 'date');

        let delete_db_status = await weekoffHolidayTran.destroy({
          where: {
            userMasterID: finalresp[m].UserMasterID,
            yearMonth: finalresp[m].YearMM,
          },
        });
        await sequelize.transaction(async (t) => {
          let insert_db_status = await weekoffHolidayTran.bulkCreate(
            insertdata,
            { transaction: t }
          );
        });
      }
    } else {
    }

    res.status(200).json({
      status: 200,
      data: finalresp,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserAttendnaceConfig = async (req, res, newxt) => {
  try {
    const userMasterID = req.params.id;
    await sequelize.transaction(async (t) => {
      var getEmpJoin = await employeeJoiningDetails.findOne({
        where: {
          userMasterID: userMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: false }],
      });

      var getEmpSalary = await employeeSalaryPolicies.findOne({
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
        include: [{ all: true, nested: false }],
      });

      res.status(200).json({
        status: 200,
        Joindata: getEmpJoin,
        Salarydata: getEmpSalary,
      });
    });
  } catch (err) {
    next(err);
  }
};

/*
 *to update data by AttnTranId
 *@param {AttnTranId} to update by id
 */
exports.postUpdateMonWorkDaysAttnValbyAttnTranId = async (req, res, next) => {
  try {
    let = { AttnTranId, MonWorkDays, AttnVal, updateBy, updateByIp } =
      await req.body;
    await sequelize.transaction(async (t) => {
      change_data_status = await HrLeaveMonthlyTrans.update(
        {
          MonWorkDays,
          AttnVal,
          updateBy,
          updateByIp,
        },
        {
          where: { AttnTranId: AttnTranId },
          transaction: t,
        }
      );
    });
    if (change_data_status == 0) {
      res.status(200).json({
        status: 404,
        message: message.usermessage.hrleavemonthlytransdatanotfound,
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.hrleavemonthlytransupdate,
      });
    }
  } catch (err) {
    next(err);
  }
};

/*
 *to update data by LeaveAttnTranId
 *@param {UserMasterID} to update by id
 */

async function calculateExtraDays(
  salaryPolicy,
  salaryData = [],
  userMasterID,
  start_date,
  end_date,
  monday,
  salaryCalculationAct,
  calculatedAttendanceData,
  extraDays
) {
  let amount = 0;

  if (!salaryData.length) return amount;

  const grossAmount =
    salaryData.find((e) => e.payheadMasterId == 50)?.EmployeeSalaryAmount || 0;

  if (salaryData[0].baseOnCalculation == 'D') amount = grossAmount * +extraDays;
  if (salaryData[0].baseOnCalculation == 'H')
    amount = grossAmount * 8 * +extraDays;
  // if monthly salary
  if (salaryData[0].baseOnCalculation == 'M') {
    let salary_CalculationDays = Number(monday);
    let calculateBy;
    let shiftHrs = 8;

    if (salaryPolicy) {
      let salaryCalculationDays =
          salaryPolicy['salaryPolicy.salaryCalculationDays'],
        salarycalbasedon =
          salaryPolicy['salaryPolicy.salarycalculationBasedon'];

      if (salaryCalculationDays && salarycalbasedon == 'daywise') {
        salary_CalculationDays = salaryCalculationDays;
      } else {
        if (salarycalbasedon == 'hourwise') {
          calculateBy = 'hourwise';

          const attendance = await attendanceTransaction.findOne({
            raw: true,
            where: {
              userMasterID: userMasterID,
              AttendanceDate: {
                [Sequelize.Op.between]: [start_date, end_date],
              },
            },
            order: [['AttendanceDate', 'DESC']],
          });

          shiftHrs = +attendance?.Shifthrs || 8;

          let monthly_Workingminutes = 0;

          if (!salaryPolicy['salaryPolicy.monthlyFixhours']) {
            if (!salaryPolicy['salaryPolicy.dailyFixhours']) {
              if (attendance) {
                monthly_Workingminutes =
                  Number(attendance.Shifthrs) * Number(monday) * 60;
              } else {
                monthly_Workingminutes = 8 * Number(monday) * 60;
              }
            } else {
              monthly_Workingminutes =
                Number(salaryPolicy['salaryPolicy.dailyFixhours']) *
                Number(monday) *
                60;
            }
          } else {
            monthly_Workingminutes =
              Number(salaryPolicy['salaryPolicy.monthlyFixhours']) * 60;
          }

          salary_CalculationDays = Number(monthly_Workingminutes);
        } else {
          if (salaryCalculationAct == 'F' || salaryCalculationAct == 'W') {
            const sumOfWeekoff =
              salaryCalculationAct == 'F'
                ? calculatedAttendanceData
                    .filter((e) => [30].includes(e['hrLeaveType.LeaveID']))
                    .reduce((acc, obj) => acc + +obj.AttnVal, 0)
                : calculatedAttendanceData
                    .filter((e) => [30, 31].includes(e['hrLeaveType.LeaveID']))
                    .reduce((acc, obj) => acc + +obj.AttnVal, 0);

            salary_CalculationDays = +monday - +sumOfWeekoff;
          }
        }
      }
    } else {
      if (salaryCalculationAct == 'F' || salaryCalculationAct == 'W') {
        const sumOfWeekoff =
          salaryCalculationAct == 'F'
            ? calculatedAttendanceData
                .filter((e) => [30].includes(e['hrLeaveType.LeaveID']))
                .reduce((acc, obj) => acc + +obj.value, 0)
            : calculatedAttendanceData
                .filter((e) => [30, 31].includes(e['hrLeaveType.LeaveID']))
                .reduce((acc, obj) => acc + +obj.value, 0);

        salary_CalculationDays = +monday - +sumOfWeekoff;
      }
    }

    // if hourly

    if (calculateBy == 'hourwise') {
      amount =
        (grossAmount / +salary_CalculationDays) * +shiftHrs * 60 * +extraDays;
    } else {
      amount = (grossAmount / +salary_CalculationDays) * +extraDays;
    }
  }
  return amount;
}

exports.postUpdateLeaveAttnTranId = async (req, res, next) => {
  try {
    let {
      ArrayData,
      coffType = null,
      coffValue = 0,
      weekoffPolicyType = null,
      weekoffValue = 0,
    } = req.body;

    if (ArrayData.length > 0) {
      const check_NegativeValue = ArrayData.filter((item) => +item.AttnVal < 0);

      if (
        check_NegativeValue.length > 0 &&
        req.userDetails.companyMasterId != 384
      ) {
        return res.status(200).json({
          status: 401,
          message: 'Attendance Value Should be positive value!',
        });
      }

      let userMasterID = ArrayData[0].userMasterID;
      let yearMonth = ArrayData[0].AttnYearMon;

      let monday = daysInMonth(yearMonth.slice(4, 6), yearMonth.slice(0, 4));

      let end_date =
        String(yearMonth).slice(0, 4) +
        '-' +
        String(yearMonth).slice(4, 6) +
        '-' +
        monday;

      const joiningdata = await EmployeeJoiningDetails.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
        include: [{ model: UserMaster }],
      });

      await sequelize.transaction(async (t) => {
        for (let i = 0; i < ArrayData.length; i++) {
          await HrLeaveMonthlyTrans.update(
            {
              AttnVal: ArrayData[i].AttnVal || 0,
              verified: 1,
              MonDays: ArrayData[i].MonDays,
              updateBy: ArrayData[i].createBy,
              updateByIp: ArrayData[i].createByIp,
            },
            {
              where: {
                userMasterID: ArrayData[i].userMasterID,
                AttnYearMon: ArrayData[i].AttnYearMon,
                LeaveTranId: ArrayData[i].LeaveTranId,
              },
              transaction: t,
            }
          );
        }

        await HrLeaveMonthlyTrans.update(
          {
            verified: 1,
            updateBy: req.userDetails.userMasterId,
            updateByIp: req.userDetails.ipAddress,
          },
          {
            where: {
              userMasterID: userMasterID,
              AttnYearMon: yearMonth,
            },
            transaction: t,
          }
        );

        // Set Actual Weekoff if weekoffPolicyType is onpresent days
        if (
          weekoffPolicyType &&
          weekoffPolicyType == weekoffTypeEnum.ONPRESENTDAY
        ) {
          const weekoffData = await HrLeaveMonthlyTrans.findOne({
            where: {
              userMasterID,
              AttnYearMon: yearMonth,
            },
            include: [
              {
                model: HrLeaveTypes,
                where: {
                  LeaveID: 30,
                },
                attributes: ['LeaveID'],
              },
            ],
            transaction: t,
          });

          if (weekoffData) {
            weekoffData.AttnVal = +weekoffValue;
            await weekoffData.save({ transaction: t });
          }
        }

        const All_findAttnData = await HrLeaveMonthlyTrans.findAll({
          raw: true,
          where: {
            userMasterID,
            AttnYearMon: yearMonth,
          },
          include: [
            {
              model: HrLeaveTypes,
              where: {
                LeaveID: { [Sequelize.Op.in]: [1, 7, 9, 30, 31, 32, 20] },
              },
              attributes: ['LeaveID'],
            },
          ],
          transaction: t,
        });

        const workingData =
          All_findAttnData.find((e) => e['hrLeaveType.LeaveID'] == 20) || null;

        const findAttnData = All_findAttnData.filter(
          (e) => e['hrLeaveType.LeaveID'] != 20
        );

        let start_date =
          findAttnData.length > 0 && findAttnData[0].monthstartdate
            ? findAttnData[0].monthstartdate
            : yearMonth.slice(0, 4) + '-' + yearMonth.slice(4, 6) + '-' + '01';

        end_date =
          findAttnData.length > 0 && findAttnData[0].monthenddate
            ? findAttnData[0].monthenddate
            : yearMonth.slice(0, 4) +
              '-' +
              yearMonth.slice(4, 6) +
              '-' +
              monday;

        const user_salaryPolicy = await employeeSalaryPolicies.findOne({
          raw: true,
          where: {
            status: 1,
            userMasterID: userMasterID,
            startDate: {
              [Sequelize.Op.lte]: end_date,
            },

            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.is]: null } },
              { endDate: { [Sequelize.Op.gte]: end_date } },
            ],
          },
          include: [
            {
              model: SalaryPolicy,
              as: 'salaryPolicy',
            },
          ],
          transaction: t,
        });

        const salaryCalculationBasedOn = user_salaryPolicy
          ? user_salaryPolicy['salaryPolicy.salarycalculationBasedon']
          : '';

        // Attendance Bonus
        let extraDays = 0;

        const attendanceBonusPolicy =
          await EmployeeAttendanceBonusPolicy.findOne({
            raw: true,
            where: {
              status: 1,
              userMasterID,
              startDate: {
                [Sequelize.Op.lte]: end_date,
              },

              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.is]: null } },
                { endDate: { [Sequelize.Op.gte]: end_date } },
              ],
            },
            include: [
              {
                model: AttendanceBonusPolicy,
              },
            ],
            transaction: t,
          });

        const attBonus_ExtraDays = await Incentivetype.findAll({
          raw: true,
          where: Sequelize.and(
            Sequelize.where(
              sequelize.fn(
                'TRIM',
                sequelize.fn('LOWER', sequelize.col('incentivetypename'))
              ),

              {
                [Sequelize.Op.in]: ['attendance bonus', 'extra days'],
              }
            ),
            Sequelize.where(
              sequelize.col('companyMasterID'),
              joiningdata['userMaster.companyMasterId']
            ),
            Sequelize.or(
              Sequelize.where(sequelize.col('status'), 0),
              Sequelize.where(sequelize.col('status'), 1)
            )
          ),
          transaction: t,
        });

        const attBonusTypeIncentive = attBonus_ExtraDays.find(
          (e) =>
            String(e.incentivetypename).trim().toLocaleLowerCase() ==
            'attendance bonus'
        );
        const extraDaysTypeInc = attBonus_ExtraDays.find(
          (e) =>
            String(e.incentivetypename).trim().toLocaleLowerCase() ==
            'extra days'
        );

        let salaryData = [];

        if (attBonusTypeIncentive || extraDaysTypeInc) {
          salaryData = await getUserSalaryMasterByMonth(
            userMasterID,
            yearMonth
          );
        }

        // check condition attendanceBonusPolicy and not set No attendanceBonusPolicy and Attendance Bonus is present in company

        if (
          attendanceBonusPolicy &&
          !attendanceBonusPolicy[
            'attendanceBonusPolicy.setNoattendanceBonusPolicy'
          ] &&
          attBonusTypeIncentive
        ) {
          let eligibleForBonus = false,
            monthly_PaidDays = 0,
            actual_Present = 0,
            slot = null;

          // for hourly salary calculation
          if (
            salaryCalculationBasedOn == 'hourwise' &&
            attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'hourly'
          ) {
            const userWorkingMinutes = +workingData?.AttnVal || 0;
            const minAttnBonusMin = Math.round(
              +attendanceBonusPolicy['attendanceBonusPolicy.min_bonus_hrs'] * 60
            );

            if (+userWorkingMinutes >= +minAttnBonusMin)
              eligibleForBonus = true;
          }

          // for daily salary calculation

          if (
            salaryCalculationBasedOn != 'hourwise' &&
            attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'daily'
          ) {
            // Set Monthly Paid Days
            if (joiningdata && joiningdata.salaryCalculationAct == 'F') {
              const weekoff = findAttnData
                .filter((e) => e['hrLeaveType.LeaveID'] == 30)
                .reduce((acc, obj) => acc + +obj.AttnVal, 0);
              monthly_PaidDays = +monday - +weekoff;
              actual_Present = findAttnData
                .filter(
                  (e) =>
                    e['hrLeaveType.LeaveID'] == 1 ||
                    e['hrLeaveType.LeaveID'] == 9
                )
                .reduce((acc, obj) => acc + +obj.AttnVal, 0);
            } else if (joiningdata && joiningdata.salaryCalculationAct == 'W') {
              const weekoffHoliday = findAttnData
                .filter(
                  (e) =>
                    e['hrLeaveType.LeaveID'] == 30 ||
                    e['hrLeaveType.LeaveID'] == 31
                )
                .reduce((acc, obj) => acc + +obj.AttnVal, 0);
              monthly_PaidDays = +monday - +weekoffHoliday;
              actual_Present = findAttnData
                .filter((e) => e['hrLeaveType.LeaveID'] == 1)
                .reduce((acc, obj) => acc + +obj.AttnVal, 0);
            } else {
              monthly_PaidDays = +monday;
              actual_Present = findAttnData
                .filter(
                  (e) =>
                    e['hrLeaveType.LeaveID'] == 1 ||
                    e['hrLeaveType.LeaveID'] == 7 ||
                    e['hrLeaveType.LeaveID'] == 9
                )
                .reduce((acc, obj) => acc + +obj.AttnVal, 0);
            }

            // if set fix days
            if (
              attendanceBonusPolicy['attendanceBonusPolicy.setPresentDay'] ==
              'Fix'
            ) {
              const presentDays = findAttnData.find(
                (e) => e['hrLeaveType.LeaveID'] == 1
              )
                ? findAttnData.find((e) => e['hrLeaveType.LeaveID'] == 1)
                    .AttnVal
                : 0;

              // Set Slot

              if (
                attendanceBonusPolicy['attendanceBonusPolicy.slots'] ==
                'twoSlot'
              ) {
                if (
                  +presentDays >=
                  +attendanceBonusPolicy[
                    'attendanceBonusPolicy.noofPrentDaySlot2'
                  ]
                ) {
                  slot = attendanceBonusPolicy['attendanceBonusPolicy.slots'];
                  eligibleForBonus = true;
                } else {
                  if (
                    +presentDays >=
                    +attendanceBonusPolicy['attendanceBonusPolicy.noofPrentDay']
                  ) {
                    slot = 'oneSlot';
                    eligibleForBonus = true;
                  }
                }
              } else {
                if (
                  +presentDays >=
                  +attendanceBonusPolicy['attendanceBonusPolicy.noofPrentDay']
                ) {
                  slot = 'oneSlot';
                  eligibleForBonus = true;
                }
              }
            } else if (
              attendanceBonusPolicy['attendanceBonusPolicy.setPresentDay'] ==
              'Half'
            ) {
              if (+monthly_PaidDays / 2 <= +actual_Present)
                eligibleForBonus = true;
            } else {
              const totalPaidDays = findAttnData
                .filter((e) => ![30, 31, 32].includes(e['hrLeaveType.LeaveID']))
                .reduce((acc, obj) => acc + +obj.AttnVal, 0);

              if (+totalPaidDays == +monday) eligibleForBonus = true;
            }
          }

          // check eligibleForBonus is true

          if (eligibleForBonus) {
            let amount = 0;

            const salaryCalculationType =
              salaryData.length > 0 ? salaryData[0].baseOnCalculation : '';

            // for daily salary

            if (
              attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'daily'
            ) {
              const attendnaceBonusType =
                slot == 'twoSlot'
                  ? attendanceBonusPolicy[
                      'attendanceBonusPolicy.attendanceBonustypeSlot2'
                    ]
                  : attendanceBonusPolicy[
                      'attendanceBonusPolicy.attendanceBonustype'
                    ];

              const attendnaceBonusAmount =
                slot == 'twoSlot'
                  ? +attendanceBonusPolicy[
                      'attendanceBonusPolicy.attendanceBonusAmountSlot2'
                    ]
                  : +attendanceBonusPolicy[
                      'attendanceBonusPolicy.attendanceBonusAmount'
                    ];

              // if Attendance Bonus Amount is Fixed
              if (
                attendnaceBonusType == 'Fix' &&
                salaryCalculationType != 'H'
              ) {
                amount = attendnaceBonusAmount;
              } else {
                // Set Extra Days
                extraDays = attendnaceBonusAmount;
                const grossAmount =
                  salaryData.find((e) => e.payheadMasterId == 50)
                    ?.EmployeeSalaryAmount || 0;

                // if salaryCalculationType is daywise
                if (salaryCalculationType == 'D')
                  amount = +grossAmount * attendnaceBonusAmount;
                // if salaryCalculationType is Month Wise
                if (salaryCalculationType == 'M') {
                  let perDayAmount = 0;

                  if (salaryCalculationBasedOn == 'daywise')
                    perDayAmount =
                      +grossAmount /
                      +user_salaryPolicy['salaryPolicy.salaryCalculationDays'];
                  else {
                    // if salaryCalculationAct set as factory act
                    if (
                      joiningdata &&
                      joiningdata.salaryCalculationAct == 'F'
                    ) {
                      const actualWeekoff = findAttnData.find(
                        (e) => e['hrLeaveType.LeaveID'] == 30
                      );

                      perDayAmount =
                        +grossAmount /
                        (+monday -
                          (actualWeekoff ? +actualWeekoff.AttnVal : 0));
                    } else if (
                      joiningdata &&
                      joiningdata.salaryCalculationAct == 'W'
                    ) {
                      const actualWeekoffHoliday = findAttnData
                        .filter(
                          (e) =>
                            e['hrLeaveType.LeaveID'] == 30 ||
                            e['hrLeaveType.LeaveID'] == 31
                        )
                        .reduce((acc, obj) => acc + obj.AttnVal, 0);

                      perDayAmount =
                        +grossAmount / (+monday - actualWeekoffHoliday);
                    } else {
                      perDayAmount = +grossAmount / +monday;
                    }
                  }

                  amount = perDayAmount * attendnaceBonusAmount;
                }
              }
            }
            // for houly salary
            if (
              attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'hourly'
            ) {
              let minutes = 0;
              // find trans for shift
              const att = await attendanceTransaction.findOne({
                where: {
                  userMasterID,
                  AttendanceDate: {
                    [Sequelize.Op.between]: [start_date, end_date],
                  },
                },
                order: [['AttendanceDate', 'DESC']],
              });

              if (
                attendanceBonusPolicy['attendanceBonusPolicy.bonus_criteria'] ==
                'fix'
              )
                minutes = Math.round(
                  +attendanceBonusPolicy['attendanceBonusPolicy.hours'] * 60
                );

              if (
                attendanceBonusPolicy['attendanceBonusPolicy.bonus_criteria'] ==
                'shift'
              ) {
                minutes = att
                  ? Math.round(
                      +att.Shifthrs *
                        60 *
                        +attendanceBonusPolicy['attendanceBonusPolicy.hours']
                    )
                  : 0;
              }

              let perMinuteGross = 0;

              const grossAmount =
                salaryData.find((e) => e.payheadMasterId == 50)
                  ?.EmployeeSalaryAmount || 0;

              // if hourly salary structure
              if (salaryCalculationType == 'H')
                perMinuteGross = +grossAmount / 60;
              // daily salary structure
              if (salaryCalculationType == 'D') {
                if (user_salaryPolicy['salaryPolicy.dailyFixhours'])
                  perMinuteGross =
                    +grossAmount /
                    (+user_salaryPolicy['salaryPolicy.dailyFixhours'] * 60);

                if (!user_salaryPolicy['salaryPolicy.dailyFixhours'] && att)
                  perMinuteGross = +grossAmount / (+att.Shifthrs * 60);
              }
              // monthly salary structure
              if (salaryCalculationType == 'M') {
                const days = calculateDays(start_date, end_date) || 0;

                if (user_salaryPolicy['salaryPolicy.monthlyFixhours'])
                  perMinuteGross =
                    +grossAmount /
                    (+user_salaryPolicy['salaryPolicy.monthlyFixhours'] * 60);

                if (
                  user_salaryPolicy['salaryPolicy.dailyFixhours'] &&
                  !user_salaryPolicy['salaryPolicy.monthlyFixhours']
                )
                  perMinuteGross =
                    +grossAmount /
                    (+user_salaryPolicy['salaryPolicy.dailyFixhours'] *
                      days *
                      60);

                if (
                  !user_salaryPolicy['salaryPolicy.dailyFixhours'] &&
                  !user_salaryPolicy['salaryPolicy.monthlyFixhours'] &&
                  att
                )
                  perMinuteGross = +grossAmount / (+att.Shifthrs * days * 60);
              }
              // set minutes and amount
              extraDays = +minutes;
              amount = +perMinuteGross * +minutes;
            }

            const attendanceBonus_leaveType = findAttnData.find(
              (e) => e['hrLeaveType.LeaveID'] == 32
            );

            // if Extra Days is greater than zero
            if (+extraDays > 0 && attendanceBonus_leaveType) {
              await HrLeaveMonthlyTrans.update(
                {
                  AttnVal: extraDays,
                  verified: 1,
                  updateBy: req.userDetails.userMasterId,
                  updateByIp: req.userDetails.ipAddress,
                },
                {
                  where: {
                    userMasterID: userMasterID,
                    AttnYearMon: yearMonth,
                    LeaveTranId: attendanceBonus_leaveType.LeaveTranId,
                  },
                  transaction: t,
                }
              );
            }

            // if amount is greater than Zero

            if (+amount > 0) {
              // Add Attendance Bonus in Employee Attendance
              await Employeeincentive.create(
                {
                  userMasterID,
                  yearmonth: yearMonth,
                  amount: Math.round(amount),
                  IncentivetypeID: attBonusTypeIncentive.IncentivetypeID,
                  incentiveDate: end_date,
                  createBy: req.userDetails.userMasterId,
                },
                {
                  transaction: t,
                }
              );
            }
          }
        }

        // -------------------Add coff or Extra Days from Attendance Calculation ----------------------

        if (
          [weekoffTypeEnum.MONTHLYFIX, weekoffTypeEnum.ONPRESENTDAY].includes(
            weekoffPolicyType
          ) &&
          coffValue &&
          coffType
        ) {
          if (coffType == 'AddLeave' && joiningdata) {
            const coffLeaveType = await HrLeaveTypes.findOne({
              where: {
                companyMasterID: joiningdata['userMaster.companyMasterId'],
                LeaveID: 6,
                status: 1,
              },
            });

            if (coffLeaveType) {
              // create leave balance
              const leaveBalance = await HrLeaveBalance.create(
                {
                  LeaveTranId: coffLeaveType.LeaveTranId,
                  userMasterID,
                  YearMM: yearMonth,
                  LeaveAddNew: +coffValue,
                  createBy: req.userDetails.userMasterId,
                  createByIp: req.userDetails.userIpAddress,
                },
                {
                  transaction: t,
                }
              );

              await coffMaster.create(
                {
                  LeaveBalTranId: leaveBalance.LeaveBalTranId,
                  LeaveTranId: coffLeaveType.LeaveTranId,
                  userMasterID,
                  LeaveCreatedDate: end_date,
                  YearMM: yearMonth,
                  LeaveAddNew: +coffValue,
                  authorizationStatus: 3,
                  From: 'AC',
                  createBy: req.userDetails.userMasterId,
                  createByIp: req.userDetails.userIpAddress,
                },
                {
                  transaction: t,
                }
              );
            }
          }

          if (coffType == 'AddExtraDays') {
            // Add Extra Days
            await ExtraDays.create(
              {
                userMasterID,
                date: end_date,
                days: +coffValue,
                employeeincentiveID: null,
                authorizationStatus: 3,
                From: 'AC',
              },
              {
                user: req.userDetails,
                transaction: t,
              }
            );
          }
        }

        // Extra Days calculation --------------------

        if (extraDaysTypeInc) {
          const extraDaysData = await ExtraDays.findAll({
            where: {
              userMasterID,
              date: {
                [Sequelize.Op.between]: [start_date, end_date],
              },
              authorizationStatus: 3,
            },
            transaction: t,
          });

          // if extra days data exist
          if (extraDaysData.length) {
            const extraDays = extraDaysData.reduce(
              (acc, obj) => acc + +obj.days,
              0
            );
            const amount = await calculateExtraDays(
              user_salaryPolicy,
              salaryData,
              userMasterID,
              start_date,
              end_date,
              monday,
              joiningdata?.salaryCalculationAct || '',
              All_findAttnData,
              extraDays
            );
            if (Math.round(+amount) > 0) {
              const addedData = await Employeeincentive.create(
                {
                  userMasterID,
                  yearmonth: yearMonth,
                  amount: Math.round(amount),
                  IncentivetypeID: extraDaysTypeInc.IncentivetypeID,
                  incentiveDate: end_date,
                  createBy: req.userDetails.userMasterId,
                },
                {
                  transaction: t,
                }
              );
              // update Extra Days
              await ExtraDays.update(
                {
                  employeeincentiveID: addedData.employeeincentiveID,
                  updateBy: req.userDetails.userMasterId,
                },
                {
                  where: {
                    extraDaysID: {
                      [Sequelize.Op.in]: extraDaysData.map(
                        (e) => e.extraDaysID
                      ),
                    },
                  },
                  hooks: false,
                  transaction: t,
                }
              );
            }
          }
        }
      });

      // hourly overtime request

      let ot_value = await executeQuery(
        `
      select HrLM."AttnVal"  from "hrLeaveMonthlyTrans" as HrLM left outer join 
      "hrLeaveTypes" as HrLT on HrLM."LeaveTranId" = HrLT."LeaveTranId" 
      WHERE HrLT."LeaveID"=21 and HrLM."userMasterID"=` +
          userMasterID +
          ` and HrLM."AttnYearMon"=` +
          yearMonth +
          ` and HrLM."AttnVal">0`
      );

      if (ot_value.length > 0 && joiningdata && joiningdata.overtime == 1) {
        let user_attendancepolicy = await EmployeeAttendancePolicy.findOne({
          where: {
            status: 1,
            userMasterID,
            startDate: {
              [Sequelize.Op.lte]: end_date,
            },

            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.is]: null } },
              { endDate: { [Sequelize.Op.gte]: end_date } },
            ],
          },
          include: [
            {
              model: AttendancePolicy,
              as: 'attendancePolicy',
              // attributes: ['salaryCycleDate']
            },
          ],
        });

        const company = joiningdata['userMaster.companyMasterId'];

        let overtimeEntryAfter;

        if (user_attendancepolicy) {
          overtimeEntryAfter =
            user_attendancepolicy.attendancePolicy.overtimeEntryAfterMin;
        } else {
          overtimeEntryAfter = 0;
        }

        if (overtimeEntryAfter == null || overtimeEntryAfter == '') {
          overtimeEntryAfter = 0;
        }

        if (Number(ot_value[0].AttnVal) > Number(overtimeEntryAfter)) {
          let final_ot_min = Number(ot_value[0].AttnVal);

          let data = {
            AttendanceTransID: null,
            UserMasterID: userMasterID,
            OverTimeDate: end_date,
            OverTimeIn: null,
            OverTimeOut: null,
            OverTimeHourAndMin: final_ot_min,
            AttendancePolicyID: null,
            CompanyMasterID: company,
            createBy: ArrayData[0].createBy,
            createByIp: ArrayData[0].createByIp ? ArrayData[0].createByIp : 4,
          };

          await overtimeauthorization(data);
        }
      }

      const companyId = joiningdata
        ? joiningdata['userMaster.companyMasterId']
        : '';

      // condition for Asopalv
      if (
        (companyId == 277 || companyId == 298 || companyId == 300) &&
        joiningdata.overtime == 1
      ) {
        const ot_data = await getOTDaysforAsopalav(userMasterID, yearMonth);

        if (+ot_data.minutes > 0) {
          const data = {
            AttendanceTransID: null,
            UserMasterID: userMasterID,
            OverTimeDate: ot_data.date,
            OverTimeIn: null,
            OverTimeOut: null,
            OverTimeHourAndMin: ot_data.minutes,
            AttendancePolicyID: null,
            CompanyMasterID: companyId,
            createBy: ArrayData[0].createBy,
            createByIp: ArrayData[0].createByIp ? ArrayData[0].createByIp : 4,
          };

          await overtimeauthorizationForAsopalav(data);
        }
      }

      // SRI VAISHNAVI RETAIL (INDIA) LLP

      if (companyId == 237) {
        const absentdata = ArrayData.find((e) => e.LeaveTranId == 1471); //leavetranid for absent

        const absent = absentdata ? +absentdata.AttnVal : 0;

        // paid leave incentive

        await addThreeDaysExtraAmount(
          userMasterID,
          yearMonth,
          absent,
          ArrayData[0].createBy,
          ArrayData[0].createByIp,
          end_date
        );

        const branch = await employeeBranch(userMasterID, end_date);

        const branchId = branch ? branch.branchID : '';

        const attendancedata = await getAttendanceData(
          userMasterID,
          start_date,
          end_date,
          false
        );

        // weekoff incentive

        await checkSundayPresentDoublesalary(
          attendancedata,
          userMasterID,
          start_date,
          end_date,
          branchId,
          yearMonth,
          ArrayData[0].createBy,
          ArrayData[0].createByIp
        );

        // lunch break penalty

        await lunchBreakPenaltyForVaishnavi(
          attendancedata,
          end_date,
          ArrayData[0].createBy,
          ArrayData[0].createByIp
        );
      }
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.UpdateHrLeaveMonthlyTrans,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteattendance = async (req, res, next) => {
  try {
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await HrLeaveMonthlyTrans.destroy({
        where: { userMasterID: req.body.uid, AttnYearMon: req.body.yyyymm },
        transaction: t,
      });
    });

    res
      .status(200)
      .json({ status: 200, message: message.usermessage.attendancedelte });
    return change_data_status;
  } catch (err) {
    next(err);
  }
};

async function findBranchDepartDesig(start_date, userid) {
  const employeebranch = await employeeBranch(userid, start_date);

  let assignbranch;
  let branchid;
  if (employeebranch) {
    assignbranch = employeebranch['branchMaster.branchName'];
    branchid = employeebranch.branchID;
  } else {
    assignbranch = '';
    branchid = null;
  }

  const employeedepart = await employeeDepartment(userid, start_date);

  let assigndepart;
  let departid;
  if (employeedepart) {
    assigndepart = employeedepart['department.departmentName'];
    departid = employeedepart.departmentID;
  } else {
    assigndepart = '';
    departid = null;
  }

  const employeedesig = await employeeDesignation(userid, start_date);

  let assigndesig;
  let desigid;
  if (employeedesig) {
    assigndesig = employeedesig['designation.designationName'];
    desigid = employeedesig.designationID;
  } else {
    assigndesig = '';
    desigid = null;
  }

  let data = {
    branch: assignbranch,
    branchid: branchid,
    depart: assigndepart,
    departid: departid,
    desig: assigndesig,
    desigid: desigid,
  };

  return data;
}

function getDayOfWeek(date) {
  const dayOfWeek = new Date(date).getDay();
  return isNaN(dayOfWeek)
    ? null
    : [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ][dayOfWeek];
}

exports.attendanceCalculation = async (req, res, next) => {
  try {
    const {
      month,
      leftdate,
      userMasterID,
      page,
      limit,
      attendanceStatus,
      salaryStatus,
      salarySlipStatus,
    } = await req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    // ----- get previous month to next month -----------------

    const { startDate, endDate } = getStartAndEndDate(+month);

    let year, Month, monday;

    if (leftdate) {
      year = String(leftdate).slice(0, 4);
      Month = String(leftdate).slice(5, 7);
      monday = daysInMonth(Month, year);
    } else {
      year = String(+month).slice(0, 4);
      Month = String(+month).slice(4, 6);
      monday = daysInMonth(Month, year);
    }

    const enddate = year + '-' + Month + '-' + monday;
    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const hrleaveMonthlyTransCondition = ['0', '1'].includes(attendanceStatus)
      ? { AttnYearMon: month, verified: +attendanceStatus }
      : { AttnYearMon: month };
    const requiredLeave = ['0', '1'].includes(attendanceStatus) ? true : false;

    const salarySlipCondition = { salaryYYYYMM: month };

    if (salarySlipStatus)
      salarySlipCondition.salarySlipIssue = salarySlipStatus;

    if (salaryStatus == '2') salarySlipCondition.paid = true;

    const whereCondition = {
      userMasterID: {
        [Sequelize.Op.in]: userMasterID,
      },
      status: 1,
    };

    const includeArray = [
      {
        required: requiredLeave,
        model: HrLeaveMonthlyTrans,
        where: hrleaveMonthlyTransCondition,
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
            model: hrLeaveTypes,
            attributes: ['LeaveID'],
            include: [
              {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
                attributes: ['LeaveName', 'LeaveDesc'],
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
        model: employeeSalaryPolicies,
        where: {
          status: 1,
          startDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(enddate),
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
        model: EmployeeDesignation,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(startDate) },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        required: false,
        attributes: ['designationID', 'applicableDate', 'endDate'],
        include: [
          {
            model: Designation,
            as: 'designation',
            attributes: ['designationName', 'designationId'],
          },
        ],
      },
      {
        model: EmployeeDepartment,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(startDate) },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        required: false,
        attributes: ['departmentID', 'applicableDate', 'endDate'],
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['departmentName', 'departmentId'],
          },
        ],
      },
      {
        model: EmployeeBranch,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(startDate) },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        required: false,
        attributes: ['branchID', 'applicableDate', 'endDate'],
        include: [
          {
            model: BranchMaster,
            as: 'branchMaster',
            attributes: ['branchName', 'branchMasterID'],
          },
        ],
      },
      {
        model: EmployeeAttendancePolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(endDate) },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(startDate) },
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
      // weeoffPolicy
      {
        model: EmployeeWeekOff,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(startDate) },
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
      // coff
      {
        required: false,
        model: coffMaster,
        where: {
          YearMM: month,
          From: 'AC',
        },
      },
      // LCEG Policy
      {
        required: false,
        model: EmployeeLateEarlyPolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(endDate) },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(startDate) },
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
          YYYYMM: month,
        },
      },
      // salary Slip
      {
        required: salarySlipStatus || salaryStatus == '2' ? true : false,
        model: HRSalarySlip,
        where: salarySlipCondition,
      },
    ];

    if ([1, 2].includes(+salaryStatus)) {
      whereCondition[Sequelize.Op.and] = [
        Sequelize.literal(`EXISTS (
      SELECT 1 FROM "hrSalaryTrasactions" AS hst
      WHERE hst."userMasterID" = "userMaster"."userMasterID"
      AND hst."salaryYYYYMM" = '${month}'
    )`),
      ];
    }

    if (salaryStatus == '0') {
      whereCondition[Sequelize.Op.and] = [
        Sequelize.literal(`NOT EXISTS (
      SELECT 1 FROM "hrSalaryTrasactions" AS hst
      WHERE hst."userMasterID" = "userMaster"."userMasterID"
      AND hst."salaryYYYYMM" = '${month}'
    )`),
      ];
    }

    const { rows: usermaster, count: totalcount } =
      await UserMaster.findAndCountAll({
        distinct: true,
        where: whereCondition,
        ...paginateCondition,
        ...accessibleUsers(req.userDetails, false),
        include: includeArray,
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

    if (usermaster.length === 0)
      return res
        .status(200)
        .json({ status: 200, data: [], totalcount: totalcount });

    const companyId = usermaster[0].companyMasterId;

    const AllHrLeaveTypes = await HrLeaveTypes.findAll({
      where: {
        companyMasterID: companyId,
        status: 1,
      },
      include: [
        {
          model: HrLeaveMaster,
          as: 'LeaveMaster',
          attributes: ['LeaveName', 'LeaveDesc'],
        },
      ],
      order: [['LeaveTranId', 'ASC']],
    });

    const finaldata1 = [];

    for (let i = 0; i < usermaster.length; i++) {
      const calculatedAttendance = await attendanceCalculation1(
        usermaster[i],
        month,
        leftdate,
        AllHrLeaveTypes
      );

      finaldata1.push(calculatedAttendance[0]);
    }

    const unverifiedData = finaldata1.filter((e) => e.verified == 0);

    const userIds = [];
    const toAddData = [];
    const toAddLCEGPenaltyData = [];

    for (const data of unverifiedData) {
      userIds.push(data.userMasterID);

      // for penalty

      for (const penalty of data.penaltyArray) {
        toAddLCEGPenaltyData.push({
          userMasterID: data.userMasterID,
          YYYYMM: +data.yearMonth,
          penaltyType: penalty.penaltyType,
          penaltyValue: penalty.values,
        });
      }

      // for leave types
      for (let m = 0; m < data.user_leave.length; m++) {
        toAddData.push({
          userMasterID: data.userMasterID,
          LeaveTranId: data.user_leave[m].leavetranid,
          AttnYearMon: data.yearMonth,
          MonDays: data.MonDays,
          MonWorkDays: data.WorkingDays,
          AttnVal: data.user_leave[m].values,
          monthstartdate: data.start_date,
          monthenddate: data.end_date,
          branchID: data.branchid,
          departmentID: data.departid,
          designationID: data.desigid,
          createBy: createBy,
          createByIp: createByIp,
        });
      }
    }

    //delete data

    await sequelize.transaction(async (t) => {
      await HrLeaveMonthlyTrans.destroy({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userIds,
          },
          AttnYearMon: month,
        },
        transaction: t,
      });

      await LCEGPenalty.destroy({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userIds,
          },
          YYYYMM: month,
        },
        transaction: t,
      });

      await HrLeaveMonthlyTrans.bulkCreate(toAddData, { transaction: t });
      await LCEGPenalty.bulkCreate(toAddLCEGPenaltyData, {
        individualHooks: true,
        user: req.userDetails,
        transaction: t,
      });
    });

    return res
      .status(200)
      .json({ status: 200, data: finaldata1, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getAttendanceCalculationbyuserid = async (req, res, next) => {
  try {
    let { userMasterID, month } = await req.body;

    let data = await HrLeaveMonthlyTrans.findAll({
      where: {
        userMasterID: userMasterID,
        AttnYearMon: month,
      },
      include: [
        {
          model: UserMaster,
          attributes: [],
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });
    for (var i = 0; i < data.length; i++) {
      let empjoining = await employeeJoiningDetails.findOne({
        where: {
          userMasterID: userMasterID,
        },
      });
      let leave_type = await hrLeaveTypes.findOne({
        where: {
          LeaveTranId: data[i].LeaveTranId,
        },
      });
      let leave_name = await HrLeaveMaster.findOne({
        where: {
          LeaveID: leave_type.LeaveID,
        },
        attributes: ['LeaveName'],
        raw: true,
      });

      data[i].dataValues.leaveName = leave_name.LeaveName;
      // data[i].dataValues.Allow_field_entry = leave_type.Allow_Field_Entry;
      // data[i].dataValues.Eff_Total = leave_type.Eff_Total;
      data[i].dataValues.salaryCalculationAct = empjoining
        ? empjoining.salaryCalculationAct
        : '';
      data[i].dataValues.sortIndex = leave_type.SortIndex;
    }

    data = data.sort(function (a, b) {
      return Number(a.dataValues.sortIndex) - Number(b.dataValues.sortIndex);
    });

    res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (err) {
    next(err.message);
  }
};

async function overtimeauthorization(data) {
  let authorizationmaster = await AuthorizationMaster.findOne({
    where: { authorizationMasterName: 'Overtime' },
  });
  let authorizationdetails = await AuthorizationDetails.findOne({
    where: {
      AuthorizationMasterID: authorizationmaster.authorizationMasterID,
      userMasterID: data.UserMasterID,
      status: 1,
    },
    raw: true,
  });

  let find_overtime = await overTimeCalculation.findOne({
    where: {
      UserMasterID: data.UserMasterID,
      OverTimeDate: data.OverTimeDate,
      AttendanceTransID: null,
    },
  });

  if (find_overtime) {
    let db_status = await overTimeCalculation.update(
      {
        OverTimeIn: data.OverTimeIn,
        OverTimeOut: data.OverTimeOut,
        OverTimeHourAndMin: Math.round(+data.OverTimeHourAndMin),
      },
      {
        where: {
          UserMasterID: data.UserMasterID,
          OverTimeDate: data.OverTimeDate,
        },
      }
    );
  } else {
    if (authorizationdetails) {
      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });

      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        let result = await sequelize.transaction(async (t) => {
          let db_status = await overTimeCalculation.create(
            {
              AttendanceTransID: data.AttendanceTransID,
              UserMasterID: data.UserMasterID,
              OverTimeDate: data.OverTimeDate,
              OverTimeIn: data.OverTimeIn,
              OverTimeOut: data.OverTimeOut,
              OverTimeHourAndMin: Math.round(+data.OverTimeHourAndMin),
              AttendancePolicyID: data.AttendancePolicyID,
              AuthorizationRequired: 2,
              CompanyMasterID: data.CompanyMasterID,
              createBy: data.createBy,
              createByIp: data.createByIp,
            },
            { transaction: t }
          );
          let insert_db_status1 = await OvertimeAuthorizationRequest.create(
            {
              ReferenceID: db_status.OverTimeID,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
              status: 1,
              authstatus: 2,
              createBy: data.createBy,
              createByIp: data.createByIp,
            },
            { transaction: t }
          );

          return db_status;
        });
      } else {
        let result = await sequelize.transaction(async (t) => {
          let db_status = await overTimeCalculation.create(
            {
              AttendanceTransID: data.AttendanceTransID,
              UserMasterID: data.UserMasterID,
              OverTimeDate: data.OverTimeDate,
              OverTimeIn: data.OverTimeIn,
              OverTimeOut: data.OverTimeOut,
              OverTimeHourAndMin: Math.round(+data.OverTimeHourAndMin),
              AttendancePolicyID: data.AttendancePolicyID,
              CompanyMasterID: data.CompanyMasterID,
              AuthorizationRequired: 1,
              createBy: data.createBy,
              createByIp: data.createByIp,
            },
            { transaction: t }
          );

          for (
            var i = 0;
            i < authorizationdetails.AuthorizedByUserMasterId.length;
            i++
          ) {
            let insert_db_status1 = await OvertimeAuthorizationRequest.create(
              {
                ReferenceID: db_status.OverTimeID,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[i],
                status: 1,
                authstatus: 2,
                createBy: data.createBy,
                createByIp: data.createByIp,
              },
              { transaction: t }
            );
          }
        });
      }
    } else {
      let result = await sequelize.transaction(async (t) => {
        let db_status = await overTimeCalculation.create(
          {
            AttendanceTransID: data.AttendanceTransID,
            UserMasterID: data.UserMasterID,
            OverTimeDate: data.OverTimeDate,
            OverTimeIn: data.OverTimeIn,
            OverTimeOut: data.OverTimeOut,
            AuthorizationRequired: 0,
            OverTimeHourAndMin: Math.round(+data.OverTimeHourAndMin),
            AttendancePolicyID: data.AttendancePolicyID,
            CompanyMasterID: data.CompanyMasterID,
            createBy: data.createBy,
            createByIp: data.createByIp,
          },
          { transaction: t }
        );

        return db_status;
      });
    }
  }
}

exports.getVerifiedAllData = async (req, res, next) => {
  try {
    let { companyMasterID, yearMonth, branch, user, page, limit } =
      await req.body;
    let usermaster;
    let finaldata1 = [];
    let totalcount;
    let offset = (page - 1) * limit;

    let year = yearMonth.slice(0, 4);
    let Month = yearMonth.slice(4, 6);
    let monday = daysInMonth(Month, year);

    var monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    let month1 = monthNames[Month - 1];
    let yearmonth = month1.concat(' ', year);

    usermaster = await employeeJoiningDetails.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: user,
        },
        joiningDate: {
          [Sequelize.Op.ne]: null,
        },

        status: {
          [Sequelize.Op.in]: ['0', '1'],
        },
      },
      include: [
        {
          model: UserMaster,
          attributes: [],
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });

    for (var i = 0; i < usermaster.length; i++) {
      let year = yearMonth.slice(0, 4);
      let Month = yearMonth.slice(4, 6);
      let monday = daysInMonth(Month, year);

      let end_date = year + '-' + Month + '-' + monday;
      let date = '01';

      let start_date = year + '-' + Month + '-' + date;

      let data = await HRSalaryTrasaction.count({
        where: {
          userMasterID: usermaster[i].userMasterID,
          salaryYYYYMM: yearMonth,
        },
      });

      if (data > 0) {
        usermaster[i].SalaryDone = 'Y';
      } else {
        usermaster[i].SalaryDone = 'N';
      }

      let userdata = await UserMaster.findOne({
        where: {
          userMasterID: usermaster[i].userMasterID,
          status: {
            [Sequelize.Op.in]: ['0', '1'],
          },
        },
      });

      let employeeBranchDepartDesig = await findBranchDepartDesig(
        end_date,
        usermaster[i].userMasterID
      );

      let getalldata = await HrLeaveMonthlyTrans.findAll({
        where: {
          userMasterID: usermaster[i].userMasterID,
          AttnYearMon: yearMonth,
          verified: 1,
        },
      });

      let leavetype = [];
      if (getalldata.length > 0) {
        for (var j = 0; j < getalldata.length; j++) {
          // let get_one_data = await HrLeaveMonthlyTrans.findOne({
          //   where: {
          //     userMasterID: getalldata[j].userMasterID,
          //     AttnYearMon: getalldata[j].AttnYearMon,

          //   }
          // });

          let user_leavetype = await hrLeaveTypes.findOne({
            where: {
              LeaveTranId: getalldata[j].LeaveTranId,
              companyMasterID: companyMasterID,
            },
            include: [
              {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
              },
            ],
          });
          leavetype.push({
            LeaveName: user_leavetype.LeaveMaster.LeaveName,
            attnval: getalldata[j].AttnVal,
            LeaveTranId: getalldata[j].LeaveTranId,
          });
        }

        let newJson = {
          userMasterID: usermaster[i].userMasterID,
          empcode: usermaster[i].employeeCode,
          userName: userdata.displayName,
          userNumber: userdata.userNumber,
          gender: userdata.gender,
          branch: employeeBranchDepartDesig.branch,
          depart: employeeBranchDepartDesig.depart,
          desig: employeeBranchDepartDesig.desig,
          yearMonth: yearmonth,
          MonDays: monday,
          WorkingDays: getalldata[0].MonWorkDays,
          start_date: start_date,
          end_date: end_date,
          SalaryDone: usermaster[i].SalaryDone,
          user_leave: leavetype,
        };

        finaldata1.push(newJson);

        function paginate(array, page_size, page_number) {
          return array.slice(
            (page_number - 1) * page_size,
            page_number * page_size
          );
        }
      }
    }

    let finaldata;

    if (page == '' && limit == '') {
      finaldata = finaldata1;
      totalcount = finaldata1.length;
    } else {
      finaldata = paginate(finaldata1, limit, page);
      totalcount = finaldata1.length;
    }

    res
      .status(200)
      .json({ status: 200, data: finaldata, totalcount: totalcount });
  } catch (err) {
    next(err.message);
  }
};

exports.dataUnverify = async (req, res, next) => {
  try {
    let { userMasterID, yearMonth, updateByIp } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const monday = daysInMonth(yearMonth.slice(4, 6), yearMonth.slice(0, 4));

    const getalldata = await HrLeaveMonthlyTrans.findAll({
      raw: true,
      where: {
        userMasterID: userMasterID,
        AttnYearMon: yearMonth,
        verified: 1,
      },
      include: [{ model: hrLeaveTypes, attributes: ['LeaveID'] }],
    });

    let end_date =
      getalldata.length > 0 && getalldata[0].monthenddate
        ? getalldata[0].monthenddate
        : yearMonth.slice(0, 4) + '-' + yearMonth.slice(4, 6) + '-' + monday;

    let start_date =
      getalldata.length > 0 && getalldata[0].monthstartdate
        ? getalldata[0].monthstartdate
        : yearMonth.slice(0, 4) + '-' + yearMonth.slice(4, 6) + '-' + '01';

    let find_salary = await HRSalaryTrasaction.findAll({
      where: {
        userMasterID: userMasterID,
        salaryYYYYMM: yearMonth,
      },
      include: [
        {
          model: UserMaster,
          attributes: [],
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });

    if (find_salary.length > 0) {
      return res.status(200).json({
        status: 401,
        message: 'Salary already calculated.',
      });
    }

    let ot_value = await executeQuery(
      `
    select HrLM."AttnVal"  from "hrLeaveMonthlyTrans" as HrLM left outer join 
    "hrLeaveTypes" as HrLT on HrLM."LeaveTranId" = HrLT."LeaveTranId" 
    WHERE HrLT."LeaveID"=21 and HrLM."userMasterID"=` +
        userMasterID +
        ` and HrLM."AttnYearMon"=` +
        yearMonth +
        ` and HrLM."AttnVal">0`
    );

    const userdetails = await userDetails(userMasterID);

    const companyId = userdetails ? userdetails.companyMasterId : '';

    // hourly overtime request check
    if (
      ot_value.length > 0 ||
      companyId == 277 ||
      companyId == 298 ||
      companyId == 300
    ) {
      let overtime = await overTimeCalculation.findOne({
        where: {
          UserMasterID: userMasterID,
          OverTimeDate: end_date,
        },
      });

      if (companyId == 277 || companyId == 298 || companyId == 300) {
        overtime = null;
        overtime = await overTimeCalculation.findOne({
          where: {
            UserMasterID: userMasterID,
            OverTimeDate: end_date,
            AttendanceTransID: null,
          },
        });
      }

      if (overtime) {
        if (overtime.AuthorizationRequired == 3) {
          return res.status(200).json({
            status: 401,
            message:
              "Employee's overtime is verified , So Attendance can't unverify.",
          });
        } else {
          await sequelize.transaction(async (t) => {
            await overtimeAuthorizationRequest.destroy(
              {
                where: {
                  ReferenceID: overtime.OverTimeID,
                },
              },
              {
                transaction: t,
              }
            );

            await overTimeCalculation.destroy(
              {
                where: {
                  UserMasterID: userMasterID,
                  OverTimeDate: end_date,
                },
              },
              {
                transaction: t,
              }
            );
          });
        }
      }
    }

    await sequelize.transaction(async (t) => {
      // Set Attendance Bonus Zero
      const atendnaceBonus = getalldata.find(
        (e) => e['hrLeaveType.LeaveID'] == 32
      );

      if (atendnaceBonus) {
        await HrLeaveMonthlyTrans.update(
          {
            verified: 0,
            AttnVal: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              userMasterID: userMasterID,
              AttnYearMon: yearMonth,
              LeaveTranId: atendnaceBonus.LeaveTranId,
            },
            transaction: t,
          }
        );
      }

      // find Extra Days

      const extraDaysData = await ExtraDays.findAll({
        where: {
          userMasterID,
          date: {
            [Sequelize.Op.between]: [start_date, end_date],
          },
          employeeincentiveID: {
            [Sequelize.Op.ne]: null,
          },
        },
        transaction: t,
      });

      if (extraDaysData.length > 0 && extraDaysData[0].employeeincentiveID) {
        await ExtraDays.update(
          {
            employeeincentiveID: null,
            updateBy: req.userDetails.userMasterId,
          },
          {
            where: {
              extraDaysID: {
                [Sequelize.Op.in]: extraDaysData.map((e) => e.extraDaysID),
              },
            },
            transaction: t,
            hooks: false,
          }
        );

        await Employeeincentive.destroy({
          where: {
            employeeincentiveID: extraDaysData[0].employeeincentiveID,
          },
          transaction: t,
        });
      }

      // Delete Extra Days and coff

      await ExtraDays.destroy({
        where: {
          date: end_date,
          userMasterID,
          From: 'AC',
        },
        individualHooks: true,
        user: req.userDetails,
        transaction: t,
      });

      // Find Coff
      const findCoff = await coffMaster.findAll({
        where: {
          userMasterID,
          YearMM: yearMonth,
          From: 'AC',
        },
      });

      if (findCoff.length) {
        const LeaveBalTranIds = findCoff.map((e) => e.LeaveBalTranId);
        if (LeaveBalTranIds.length) {
          // Delete Coff Balance
          await HrLeaveBalance.destroy({
            where: {
              LeaveBalTranId: {
                [Sequelize.Op.in]: LeaveBalTranIds,
              },
            },
            transaction: t,
          });
        }
        // Delete Coff
        await coffMaster.destroy({
          where: {
            coffMasterID: {
              [Sequelize.Op.in]: findCoff.map((e) => e.coffMasterID),
            },
          },
          transaction: t,
        });
      }

      await HrLeaveMonthlyTrans.update(
        {
          verified: 0,
          updateBy: updateBy,
          updateByIp: updateByIp,
        },
        {
          where: {
            userMasterID: userMasterID,
            AttnYearMon: yearMonth,
          },
          transaction: t,
        }
      );

      // SRI VAISHNAVI RETAIL (INDIA) LLP
      if (companyId == 237) {
        // delete three days extra Amount and weekoff payment Amount

        await Employeeincentive.destroy(
          {
            where: {
              userMasterID: userMasterID,
              yearmonth: +yearMonth,
              IncentivetypeID: [159, 129], //three days extra id 129 and weekoff payment id 159
            },
          },
          { transaction: t }
        );

        // if attendance is verified
        if (getalldata.length > 0) {
          await EmployeePenalty.destroy(
            {
              where: {
                userMasterID: userMasterID,
                penaltyDate: getalldata[0].monthenddate,
                penaltyID: 64, // Lunch Break Penalty id 64
              },
            },
            { transaction: t }
          );
        }
      }

      // delete Attendance Bonus

      const dateOfAttendanceBonus = await Employeeincentive.findAll({
        where: {
          userMasterID,
          yearmonth: yearMonth,
          incentiveDate: end_date,
        },
        include: [
          {
            required: true,
            model: Incentivetype,
            where: Sequelize.and(
              Sequelize.where(
                sequelize.fn(
                  'TRIM',
                  sequelize.fn(
                    'LOWER',
                    sequelize.col('incentivetype.incentivetypename')
                  )
                ),
                'attendance bonus'
              )
            ),
          },
        ],
        transaction: t,
      });

      await Employeeincentive.destroy({
        where: {
          employeeincentiveID: dateOfAttendanceBonus.map(
            (e) => e.employeeincentiveID
          ),
        },
        transaction: t,
      });
    });

    res.status(200).json({
      status: 200,
      data: {},
      message: message.usermessage.unvarifyAttendanceCalculation,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.verifyAllAttendanceCalcution = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      userMasterID,
      yearMonth,
      verify,
      updateBy,
      updateByIp,
      leftdate,
      coffType = null,
      coffValue = 0,
    } = await req.body;

    const monday = daysInMonth(yearMonth.slice(4, 6), yearMonth.slice(0, 4));

    const enddate =
      yearMonth.slice(0, 4) + '-' + yearMonth.slice(4, 6) + '-' + monday;

    const { startDate, endDate } = getStartAndEndDate(+yearMonth);

    const AllHrLeaveTypes = await HrLeaveTypes.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      include: [
        { model: HrLeaveMaster, as: 'LeaveMaster', attributes: ['LeaveName'] },
      ],
      order: [['LeaveTranId', 'ASC']],
    });

    const NegativeValue_UserName = [];

    if (verify == '1') {
      const [usermaster, AllUserSalary] = await Promise.all([
        UserMaster.findAll({
          where: {
            userMasterID: userMasterID,
          },
          include: [
            { model: employeeJoiningDetails },
            {
              required: false,
              model: HrLeaveMonthlyTrans,
              where: { AttnYearMon: yearMonth },
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
              ],
              include: [
                {
                  model: hrLeaveTypes,
                  attributes: ['LeaveID'],
                  include: [
                    {
                      model: HrLeaveMaster,
                      as: 'LeaveMaster',
                      attributes: ['LeaveName', 'LeaveDesc'],
                    },
                  ],
                },
              ],
            },
            {
              required: false,
              model: employeeSalaryPolicies,
              where: {
                status: 1,
                startDate: {
                  [Sequelize.Op.lte]: new Date(enddate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: {
                      [Sequelize.Op.gte]: new Date(enddate),
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
                startDate: { [Sequelize.Op.lte]: new Date(endDate) },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(startDate) },
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
                    'showShift',
                    'coff',
                  ],
                },
              ],
            },

            // weeoffPolicy
            {
              model: EmployeeWeekOff,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(startDate) },
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
            // LCEG Policy
            {
              required: false,
              model: EmployeeLateEarlyPolicy,
              where: {
                status: 1,
                startDate: { [Sequelize.Op.lte]: new Date(endDate) },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(startDate) },
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
                YYYYMM: yearMonth,
              },
            },
          ],
        }),
        HRSalaryTrasaction.findAll({
          raw: true,
          where: {
            userMasterID: userMasterID,
            salaryYYYYMM: yearMonth,
          },
        }),
      ]);

      for (let i = 0; i < usermaster.length; i++) {
        const find_salary = AllUserSalary.find(
          (e) =>
            e.userMasterID == usermaster[i].userMasterID &&
            e.salaryYYYYMM == yearMonth
        );

        const empjoing = usermaster[i].employeeJoiningDetails?.[0] || null;

        if (!find_salary) {
          const attendancedataCal = await attendanceCalculation1(
            usermaster[i],
            yearMonth,
            leftdate,
            AllHrLeaveTypes
          );

          const unverifiedData = attendancedataCal.filter(
            (e) => e.verified == 0
          );

          if (
            unverifiedData.length &&
            unverifiedData[0].user_leave &&
            unverifiedData[0].user_leave.length
          ) {
            const toAddData = [];
            const toAddLCEGPenaltyData = [];

            // for penalty

            for (const penalty of unverifiedData[0]?.penaltyArray || []) {
              toAddLCEGPenaltyData.push({
                userMasterID: unverifiedData[0].userMasterID,
                YYYYMM: +unverifiedData[0].yearMonth,
                penaltyType: penalty.penaltyType,
                penaltyValue: penalty.values,
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
                createBy: updateBy,
                createByIp: updateByIp,
              });
            }

            //delete data

            await sequelize.transaction(async (t) => {
              await HrLeaveMonthlyTrans.destroy({
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  AttnYearMon: yearMonth,
                },
                transaction: t,
              });

              await LCEGPenalty.destroy({
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  YYYYMM: yearMonth,
                },
                transaction: t,
              });

              await HrLeaveMonthlyTrans.bulkCreate(toAddData, {
                transaction: t,
              });
              await LCEGPenalty.bulkCreate(toAddLCEGPenaltyData, {
                individualHooks: true,
                user: req.userDetails,
                transaction: t,
              });
            });
          }

          const getAlldata = await HrLeaveMonthlyTrans.findAll({
            raw: true,
            where: {
              userMasterID: usermaster[i].userMasterID,
              AttnYearMon: yearMonth,
              // verified: 0,
            },
            include: [{ model: HrLeaveTypes, attributes: ['LeaveID'] }],
          });

          // Check For Negative Value
          const check_NegativeValue = getAlldata.filter((e) => +e.AttnVal < 0);

          if (
            check_NegativeValue.length > 0 &&
            req.userDetails.companyMasterId != 384
          ) {
            NegativeValue_UserName.push(usermaster[i].displayName);
            continue;
          }

          let start_date =
            getAlldata.length > 0 && getAlldata[0].monthstartdate
              ? getAlldata[0].monthstartdate
              : yearMonth.slice(0, 4) +
                '-' +
                yearMonth.slice(4, 6) +
                '-' +
                '01';

          let end_date =
            getAlldata.length > 0 && getAlldata[0].monthenddate
              ? getAlldata[0].monthenddate
              : yearMonth.slice(0, 4) +
                '-' +
                yearMonth.slice(4, 6) +
                '-' +
                monday;

          const user_salaryPolicy = await employeeSalaryPolicies.findOne({
            raw: true,
            where: {
              status: 1,
              userMasterID: usermaster[i].userMasterID,
              startDate: {
                [Sequelize.Op.lte]: end_date,
              },

              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.is]: null } },
                { endDate: { [Sequelize.Op.gte]: end_date } },
              ],
            },
            include: [
              {
                model: SalaryPolicy,
                as: 'salaryPolicy',
              },
            ],
          });

          let overtimeAdded = '',
            salaryCalculationBasedOn = '';
          if (user_salaryPolicy) {
            // to set for salaryCalculationBasedOn
            salaryCalculationBasedOn =
              user_salaryPolicy['salaryPolicy.salarycalculationBasedon'];
            overtimeAdded = user_salaryPolicy['salaryPolicy.overtimeAdded'];
          }

          await sequelize.transaction(async (t) => {
            await HrLeaveMonthlyTrans.update(
              {
                updateBy: updateBy,
                updateByIp: updateByIp,
                verified: 1,
              },
              {
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  AttnYearMon: yearMonth,
                  // LeaveTranId: getAlldata[j].LeaveTranId,
                },
                transaction: t,
              }
            );

            // ------------------Attendance Bonus-------------------

            let extraDays = 0;

            const [attendanceBonusPolicy, attBonus_ExtraDays] =
              await Promise.all([
                EmployeeAttendanceBonusPolicy.findOne({
                  raw: true,
                  where: {
                    status: 1,
                    userMasterID: usermaster[i].userMasterID,
                    startDate: {
                      [Sequelize.Op.lte]: end_date,
                    },

                    [Sequelize.Op.or]: [
                      { endDate: { [Sequelize.Op.is]: null } },
                      { endDate: { [Sequelize.Op.gte]: end_date } },
                    ],
                  },
                  include: [
                    {
                      model: AttendanceBonusPolicy,
                    },
                  ],
                }),
                Incentivetype.findAll({
                  raw: true,
                  where: Sequelize.and(
                    Sequelize.where(
                      sequelize.fn(
                        'TRIM',
                        sequelize.fn(
                          'LOWER',
                          sequelize.col('incentivetypename')
                        )
                      ),
                      {
                        [Sequelize.Op.in]: ['attendance bonus', 'extra days'],
                      }
                    ),
                    Sequelize.where(
                      sequelize.col('companyMasterID'),
                      usermaster[i].companyMasterId
                    ),
                    Sequelize.or(
                      Sequelize.where(sequelize.col('status'), 0),
                      Sequelize.where(sequelize.col('status'), 1)
                    )
                  ),
                }),
              ]);

            const attBonusTypeIncentive = attBonus_ExtraDays.find(
              (e) =>
                String(e.incentivetypename).trim().toLocaleLowerCase() ==
                'attendance bonus'
            );
            const extraDaysTypeInc = attBonus_ExtraDays.find(
              (e) =>
                String(e.incentivetypename).trim().toLocaleLowerCase() ==
                'extra days'
            );

            let salaryData = [];

            if (attBonusTypeIncentive || extraDaysTypeInc) {
              salaryData = await getUserSalaryMasterByMonth(
                usermaster[i].userMasterID,
                yearMonth
              );
            }

            // check condition attendanceBonusPolicy and not set No attendanceBonusPolicy and Attendance Bonus is present in company

            if (
              attendanceBonusPolicy &&
              !attendanceBonusPolicy[
                'attendanceBonusPolicy.setNoattendanceBonusPolicy'
              ] &&
              attBonusTypeIncentive
            ) {
              let eligibleForBonus = false,
                monthly_PaidDays = 0,
                actual_Present = 0,
                slot = null;

              // for hourly salary calculation

              const workingData =
                getAlldata.find((e) => e['hrLeaveType.LeaveID'] == 20) || null;

              if (
                salaryCalculationBasedOn == 'hourwise' &&
                attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'hourly'
              ) {
                const userWorkingMinutes = +workingData?.AttnVal || 0;
                const minAttnBonusMin = Math.round(
                  +attendanceBonusPolicy[
                    'attendanceBonusPolicy.min_bonus_hrs'
                  ] * 60
                );

                if (+userWorkingMinutes >= +minAttnBonusMin)
                  eligibleForBonus = true;
              }

              // for daily salary calculation
              if (
                salaryCalculationBasedOn != 'hourwise' &&
                attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'daily'
              ) {
                // Set Monthly Paid Days
                if (empjoing?.salaryCalculationAct == 'F') {
                  const weekoff = getAlldata
                    .filter((e) => e['hrLeaveType.LeaveID'] == 30)
                    .reduce((acc, obj) => acc + +obj.AttnVal, 0);
                  monthly_PaidDays = +monday - +weekoff;
                  actual_Present = getAlldata
                    .filter(
                      (e) =>
                        e['hrLeaveType.LeaveID'] == 1 ||
                        e['hrLeaveType.LeaveID'] == 9
                    )
                    .reduce((acc, obj) => acc + +obj.AttnVal, 0);
                } else if (empjoing?.salaryCalculationAct == 'W') {
                  const weekoffHoliday = getAlldata
                    .filter(
                      (e) =>
                        e['hrLeaveType.LeaveID'] == 30 ||
                        e['hrLeaveType.LeaveID'] == 31
                    )
                    .reduce((acc, obj) => acc + +obj.AttnVal, 0);
                  monthly_PaidDays = +monday - +weekoffHoliday;
                  actual_Present = getAlldata
                    .filter((e) => e['hrLeaveType.LeaveID'] == 1)
                    .reduce((acc, obj) => acc + +obj.AttnVal, 0);
                } else {
                  monthly_PaidDays = +monday;
                  actual_Present = getAlldata
                    .filter(
                      (e) =>
                        e['hrLeaveType.LeaveID'] == 1 ||
                        e['hrLeaveType.LeaveID'] == 7 ||
                        e['hrLeaveType.LeaveID'] == 9
                    )
                    .reduce((acc, obj) => acc + +obj.AttnVal, 0);
                }

                // if set fix days
                if (
                  attendanceBonusPolicy[
                    'attendanceBonusPolicy.setPresentDay'
                  ] == 'Fix'
                ) {
                  const presentDays = getAlldata.find(
                    (e) => e['hrLeaveType.LeaveID'] == 1
                  )
                    ? getAlldata.find((e) => e['hrLeaveType.LeaveID'] == 1)
                        .AttnVal
                    : 0;

                  if (
                    attendanceBonusPolicy['attendanceBonusPolicy.slots'] ==
                    'twoSlot'
                  ) {
                    if (
                      +presentDays >=
                      +attendanceBonusPolicy[
                        'attendanceBonusPolicy.noofPrentDaySlot2'
                      ]
                    ) {
                      slot =
                        attendanceBonusPolicy['attendanceBonusPolicy.slots'];
                      eligibleForBonus = true;
                    } else {
                      if (
                        +presentDays >=
                        +attendanceBonusPolicy[
                          'attendanceBonusPolicy.noofPrentDay'
                        ]
                      ) {
                        slot = 'oneSlot';
                        eligibleForBonus = true;
                      }
                    }
                  } else {
                    if (
                      +presentDays >=
                      +attendanceBonusPolicy[
                        'attendanceBonusPolicy.noofPrentDay'
                      ]
                    ) {
                      eligibleForBonus = true;
                      slot = 'oneSlot';
                    }
                  }
                } else if (
                  attendanceBonusPolicy[
                    'attendanceBonusPolicy.setPresentDay'
                  ] == 'Half'
                ) {
                  if (+monthly_PaidDays / 2 <= +actual_Present)
                    eligibleForBonus = true;
                } else {
                  const totalPaidDays = getAlldata
                    .filter(
                      (e) =>
                        e['hrLeaveType.LeaveID'] == 1 ||
                        e['hrLeaveType.LeaveID'] == 7 ||
                        e['hrLeaveType.LeaveID'] == 9
                    )
                    .reduce((acc, obj) => acc + +obj.AttnVal, 0);

                  if (+totalPaidDays == +monday) eligibleForBonus = true;
                }
              }

              // check eligibleForBonus is true

              if (eligibleForBonus) {
                let amount = 0;
                const salaryCalculationType =
                  salaryData.length > 0 ? salaryData[0].baseOnCalculation : '';

                // for daily salary

                if (
                  attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'daily'
                ) {
                  const attendnaceBonusType =
                    slot == 'twoSlot'
                      ? attendanceBonusPolicy[
                          'attendanceBonusPolicy.attendanceBonustypeSlot2'
                        ]
                      : attendanceBonusPolicy[
                          'attendanceBonusPolicy.attendanceBonustype'
                        ];

                  const attendnaceBonusAmount =
                    slot == 'twoSlot'
                      ? +attendanceBonusPolicy[
                          'attendanceBonusPolicy.attendanceBonusAmountSlot2'
                        ]
                      : +attendanceBonusPolicy[
                          'attendanceBonusPolicy.attendanceBonusAmount'
                        ];
                  // if Attendance Bonus Amount is Fixed
                  if (
                    attendnaceBonusType == 'Fix' &&
                    salaryCalculationType != 'H'
                  ) {
                    amount = attendnaceBonusAmount;
                  } else {
                    extraDays = attendnaceBonusAmount;

                    const grossAmount =
                      salaryData.find((e) => e.payheadMasterId == 50)
                        ?.EmployeeSalaryAmount || 0;

                    // if salaryCalculationType is daywise
                    if (salaryCalculationType == 'D')
                      amount = +grossAmount * attendnaceBonusAmount;
                    // if salaryCalculationType is Month Wise
                    if (salaryCalculationType == 'M') {
                      let perDayAmount = 0;

                      if (salaryCalculationBasedOn == 'daywise')
                        perDayAmount =
                          +grossAmount /
                          +user_salaryPolicy[
                            'salaryPolicy.salaryCalculationDays'
                          ];
                      else {
                        // if salaryCalculationAct set as factory act
                        if (empjoing?.salaryCalculationAct == 'F') {
                          const actualWeekoff = getAlldata.find(
                            (e) => e['hrLeaveType.LeaveID'] == 30
                          );

                          perDayAmount =
                            +grossAmount /
                            (+monday -
                              (actualWeekoff ? +actualWeekoff.AttnVal : 0));
                        } else if (empjoing?.salaryCalculationAct == 'W') {
                          const actualWeekoffHoliday = getAlldata
                            .filter(
                              (e) =>
                                e['hrLeaveType.LeaveID'] == 30 ||
                                e['hrLeaveType.LeaveID'] == 31
                            )
                            .reduce((acc, obj) => acc + obj.AttnVal, 0);

                          perDayAmount =
                            +grossAmount / (+monday - actualWeekoffHoliday);
                        } else {
                          perDayAmount = +grossAmount / +monday;
                        }
                      }

                      amount = perDayAmount * attendnaceBonusAmount;
                    }
                  }
                }

                // for houly salary
                if (
                  attendanceBonusPolicy['attendanceBonusPolicy.type'] ==
                  'hourly'
                ) {
                  let minutes = 0;
                  // find trans for shift
                  const att = await attendanceTransaction.findOne({
                    where: {
                      userMasterID: usermaster[i].userMasterID,
                      AttendanceDate: {
                        [Sequelize.Op.between]: [start_date, end_date],
                      },
                    },
                    order: [['AttendanceDate', 'DESC']],
                  });

                  if (
                    attendanceBonusPolicy[
                      'attendanceBonusPolicy.bonus_criteria'
                    ] == 'fix'
                  )
                    minutes = Math.round(
                      +attendanceBonusPolicy['attendanceBonusPolicy.hours'] * 60
                    );

                  if (
                    attendanceBonusPolicy[
                      'attendanceBonusPolicy.bonus_criteria'
                    ] == 'shift'
                  ) {
                    minutes = att
                      ? Math.round(
                          +att.Shifthrs *
                            60 *
                            +attendanceBonusPolicy[
                              'attendanceBonusPolicy.hours'
                            ]
                        )
                      : 0;
                  }

                  let perMinuteGross = 0;

                  const grossAmount =
                    salaryData.find((e) => e.payheadMasterId == 50)
                      ?.EmployeeSalaryAmount || 0;

                  // if hourly salary structure
                  if (salaryCalculationType == 'H')
                    perMinuteGross = +grossAmount / 60;
                  // daily salary structure
                  if (salaryCalculationType == 'D') {
                    if (user_salaryPolicy['salaryPolicy.dailyFixhours'])
                      perMinuteGross =
                        +grossAmount /
                        (+user_salaryPolicy['salaryPolicy.dailyFixhours'] * 60);

                    if (!user_salaryPolicy['salaryPolicy.dailyFixhours'] && att)
                      perMinuteGross = +grossAmount / (+att.Shifthrs * 60);
                  }
                  // monthly salary structure
                  if (salaryCalculationType == 'M') {
                    const days = calculateDays(start_date, end_date) || 0;

                    if (user_salaryPolicy['salaryPolicy.monthlyFixhours'])
                      perMinuteGross =
                        +grossAmount /
                        (+user_salaryPolicy['salaryPolicy.monthlyFixhours'] *
                          60);

                    if (
                      user_salaryPolicy['salaryPolicy.dailyFixhours'] &&
                      !user_salaryPolicy['salaryPolicy.monthlyFixhours']
                    )
                      perMinuteGross =
                        +grossAmount /
                        (+user_salaryPolicy['salaryPolicy.dailyFixhours'] *
                          days *
                          60);

                    if (
                      !user_salaryPolicy['salaryPolicy.dailyFixhours'] &&
                      !user_salaryPolicy['salaryPolicy.monthlyFixhours'] &&
                      att
                    )
                      perMinuteGross =
                        +grossAmount / (+att.Shifthrs * days * 60);
                  }
                  // set minutes and amount
                  extraDays = +minutes;
                  amount = +perMinuteGross * +minutes;
                }

                const attendanceBonus_leaveType = getAlldata.find(
                  (e) => e['hrLeaveType.LeaveID'] == 32
                );

                // if Extra Days is greater than zero
                if (+extraDays > 0 && attendanceBonus_leaveType) {
                  await HrLeaveMonthlyTrans.update(
                    {
                      AttnVal: extraDays,
                      verified: 1,
                      updateBy: req.userDetails.userMasterId,
                      updateByIp: req.userDetails.ipAddress,
                    },
                    {
                      where: {
                        userMasterID: usermaster[i].userMasterID,
                        AttnYearMon: yearMonth,
                        LeaveTranId: attendanceBonus_leaveType.LeaveTranId,
                      },
                      transaction: t,
                    }
                  );
                }

                // if amount is greater than Zero

                if (+amount > 0) {
                  // Add Attendance Bonus in Employee Attendance
                  await Employeeincentive.create(
                    {
                      userMasterID: usermaster[i].userMasterID,
                      yearmonth: yearMonth,
                      amount: Math.round(amount),
                      IncentivetypeID: attBonusTypeIncentive.IncentivetypeID,
                      incentiveDate: end_date,
                      createBy: req.userDetails.userMasterId,
                    },
                    { transaction: t }
                  );
                }
              }
            }

            const weekoffPolicyType =
              attendancedataCal[0]?.weekoffPolicyType || null;
            const coffValue = attendancedataCal[0]?.coffValue || 0;
            const coffType = attendancedataCal[0]?.coff || null;
            const calculateOn = attendancedataCal[0]?.calculateon || '';

            // -------------------Add coff or Extra Days from Attendance Calculation ----------------------

            if (
              [
                weekoffTypeEnum.MONTHLYFIX,
                weekoffTypeEnum.ONPRESENTDAY,
              ].includes(weekoffPolicyType) &&
              coffValue &&
              coffType &&
              calculateOn != 'hourly'
            ) {
              if (coffType == 'AddLeave') {
                const coffLeaveType = AllHrLeaveTypes.find(
                  (e) => e.LeaveID == 6
                );

                if (coffLeaveType) {
                  // create leave balance
                  const leaveBalance = await HrLeaveBalance.create(
                    {
                      LeaveTranId: coffLeaveType.LeaveTranId,
                      userMasterID: usermaster[i].userMasterID,
                      YearMM: yearMonth,
                      LeaveAddNew: +coffValue,
                      createBy: req.userDetails.userMasterId,
                      createByIp: req.userDetails.userIpAddress,
                    },
                    {
                      transaction: t,
                    }
                  );

                  await coffMaster.create(
                    {
                      LeaveBalTranId: leaveBalance.LeaveBalTranId,
                      LeaveTranId: coffLeaveType.LeaveTranId,
                      userMasterID: usermaster[i].userMasterID,
                      LeaveCreatedDate: end_date,
                      YearMM: yearMonth,
                      LeaveAddNew: +coffValue,
                      authorizationStatus: 3,
                      From: 'AC',
                      createBy: req.userDetails.userMasterId,
                      createByIp: req.userDetails.userIpAddress,
                    },
                    {
                      transaction: t,
                    }
                  );
                }
              }

              if (coffType == 'AddExtraDays') {
                // Add Extra Days
                await ExtraDays.create(
                  {
                    userMasterID: usermaster[i].userMasterID,
                    date: end_date,
                    days: +coffValue,
                    employeeincentiveID: null,
                    authorizationStatus: 3,
                    From: 'AC',
                  },
                  {
                    user: req.userDetails,
                    transaction: t,
                  }
                );
              }
            }

            // Extra Days calculation --------------------

            if (extraDaysTypeInc) {
              const extraDaysData = await ExtraDays.findAll({
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  date: {
                    [Sequelize.Op.between]: [start_date, end_date],
                  },
                  authorizationStatus: 3,
                },
              });

              // if extra days data exist
              if (extraDaysData.length) {
                const extraDays = extraDaysData.reduce(
                  (acc, obj) => acc + +obj.days,
                  0
                );
                const amount = await calculateExtraDays(
                  user_salaryPolicy,
                  salaryData,
                  usermaster[i].userMasterID,
                  start_date,
                  end_date,
                  monday,
                  usermaster[i].employeeJoiningDetails?.[0]
                    ?.salaryCalculationAct || '',
                  getAlldata,
                  extraDays
                );
                if (Math.round(+amount) > 0) {
                  const addedData = await Employeeincentive.create(
                    {
                      userMasterID: usermaster[i].userMasterID,
                      yearmonth: yearMonth,
                      amount: Math.round(amount),
                      IncentivetypeID: extraDaysTypeInc.IncentivetypeID,
                      incentiveDate: end_date,
                      createBy: req.userDetails.userMasterId,
                    },
                    {
                      transaction: t,
                    }
                  );
                  // update Extra Days
                  await ExtraDays.update(
                    {
                      employeeincentiveID: addedData.employeeincentiveID,
                      updateBy: req.userDetails.userMasterId,
                    },
                    {
                      where: {
                        extraDaysID: {
                          [Sequelize.Op.in]: extraDaysData.map(
                            (e) => e.extraDaysID
                          ),
                        },
                      },
                      hooks: false,
                      transaction: t,
                    }
                  );
                }
              }
            }

            // hourly overtime request

            const ot_value = await executeQuery(
              `
            select HrLM."AttnVal"  from "hrLeaveMonthlyTrans" as HrLM left outer join 
            "hrLeaveTypes" as HrLT on HrLM."LeaveTranId" = HrLT."LeaveTranId" 
            WHERE HrLT."LeaveID"=21 and HrLM."userMasterID"=` +
                usermaster[i].userMasterID +
                ` and HrLM."AttnYearMon"=` +
                yearMonth +
                ` and HrLM."AttnVal">0`
            );

            if (ot_value.length > 0 && empjoing?.overtime == 1) {
              if (overtimeAdded != 'daily') {
                const user_attendancepolicy =
                  await EmployeeAttendancePolicy.findOne({
                    where: {
                      status: 1,
                      userMasterID: usermaster[i].userMasterID,
                      startDate: {
                        [Sequelize.Op.lte]: end_date,
                      },

                      [Sequelize.Op.or]: [
                        { endDate: { [Sequelize.Op.is]: null } },
                        { endDate: { [Sequelize.Op.gte]: end_date } },
                      ],
                    },
                    include: [
                      {
                        model: AttendancePolicy,
                        as: 'attendancePolicy',
                        // attributes: ['salaryCycleDate']
                      },
                    ],
                  });

                let overtimeEntryAfter;

                if (user_attendancepolicy) {
                  overtimeEntryAfter =
                    user_attendancepolicy.attendancePolicy
                      .overtimeEntryAfterMin;
                } else {
                  overtimeEntryAfter = 0;
                }

                if (overtimeEntryAfter == null || overtimeEntryAfter == '') {
                  overtimeEntryAfter = 0;
                }

                if (Number(ot_value[0].AttnVal) > Number(overtimeEntryAfter)) {
                  let final_ot_min = Number(ot_value[0].AttnVal);

                  let data = {
                    AttendanceTransID: null,
                    UserMasterID: usermaster[i].userMasterID,
                    OverTimeDate: end_date,
                    OverTimeIn: null,
                    OverTimeOut: null,
                    OverTimeHourAndMin: final_ot_min,
                    AttendancePolicyID: null,
                    CompanyMasterID: companyMasterID,
                    createBy: updateBy,
                    createByIp: '192.33',
                  };

                  await overtimeauthorization(data);
                }
              }
            }
          });

          // condition for Asopalv
          if (
            (companyMasterID == 277 ||
              companyMasterID == 298 ||
              companyMasterID == 300) &&
            empjoing?.overtime == 1
          ) {
            const ot_data = await getOTDaysforAsopalav(
              usermaster[i].userMasterID,
              yearMonth
            );

            if (+ot_data.minutes > 0) {
              const data = {
                AttendanceTransID: null,
                UserMasterID: usermaster[i].userMasterID,
                OverTimeDate: ot_data.date,
                OverTimeIn: null,
                OverTimeOut: null,
                OverTimeHourAndMin: +ot_data.minutes,
                AttendancePolicyID: null,
                CompanyMasterID: companyMasterID,
                createBy: updateBy,
                createByIp: updateByIp,
              };

              await overtimeauthorizationForAsopalav(data);
            }
          }

          // SRI VAISHNAVI RETAIL (INDIA) LLP

          if (companyMasterID == 237) {
            const absentdata = getAlldata.find((e) => e.LeaveTranId == 1471); //leavetranid for absent

            const absent = absentdata ? +absentdata.AttnVal : 0;

            await addThreeDaysExtraAmount(
              usermaster[i].userMasterID,
              yearMonth,
              absent,
              updateBy,
              updateByIp,
              end_date
            );

            const branch = await employeeBranch(
              usermaster[i].userMasterID,
              end_date
            );

            const branchId = branch ? branch.branchID : '';

            const attendancedata = await getAttendanceData(
              usermaster[i].userMasterID,
              start_date,
              end_date,
              false
            );

            //check weekoff payment

            await checkSundayPresentDoublesalary(
              attendancedata,
              usermaster[i].userMasterID,
              start_date,
              end_date,
              branchId,
              yearMonth,
              updateBy,
              updateByIp
            );
            await lunchBreakPenaltyForVaishnavi(
              attendancedata,
              end_date,
              updateBy,
              updateByIp
            );
          }
        }
      }
    } else {
      const find_salary = await HRSalaryTrasaction.findOne({
        where: {
          userMasterID: userMasterID,
          salaryYYYYMM: yearMonth,
        },
      });

      if (find_salary) {
        return res.status(200).json({
          status: 401,
          data: {},
          message: 'Salary already calculated.',
        });
      } else {
        const [getAlldata, joiningdata] = await Promise.all([
          HrLeaveMonthlyTrans.findAll({
            raw: true,
            where: {
              userMasterID: userMasterID,
              AttnYearMon: yearMonth,
              // verified: 0,
            },
            include: [{ model: HrLeaveTypes, attributes: ['LeaveID'] }],
          }),
          employeeJoiningDetails.findOne({
            raw: true,
            where: {
              userMasterID: userMasterID,
            },
            include: [{ model: UserMaster }],
          }),
        ]);

        // Check For Negative Value
        const check_NegativeValue = getAlldata.filter((e) => +e.AttnVal < 0);

        if (
          check_NegativeValue.length > 0 &&
          req.userDetails.companyMasterId != 384
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Attendance value should be positive value!',
          });
        }

        let start_date =
          getAlldata.length > 0 && getAlldata[0].monthstartdate
            ? getAlldata[0].monthstartdate
            : yearMonth.slice(0, 4) + '-' + yearMonth.slice(4, 6) + '-' + '01';

        let end_date =
          getAlldata.length > 0 && getAlldata[0].monthenddate
            ? getAlldata[0].monthenddate
            : yearMonth.slice(0, 4) +
              '-' +
              yearMonth.slice(4, 6) +
              '-' +
              monday;

        const user_salaryPolicy = await employeeSalaryPolicies.findOne({
          raw: true,
          where: {
            status: 1,
            userMasterID: userMasterID,
            startDate: {
              [Sequelize.Op.lte]: end_date,
            },

            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.is]: null } },
              { endDate: { [Sequelize.Op.gte]: end_date } },
            ],
          },
          include: [
            {
              model: SalaryPolicy,
              as: 'salaryPolicy',
            },
          ],
        });

        let overtimeAdded = '',
          salaryCalculationBasedOn = '';
        if (user_salaryPolicy) {
          // to set for salaryCalculationBasedOn
          salaryCalculationBasedOn =
            user_salaryPolicy['salaryPolicy.salarycalculationBasedon'];
          overtimeAdded = user_salaryPolicy['salaryPolicy.overtimeAdded'];
        }

        await sequelize.transaction(async (t) => {
          await HrLeaveMonthlyTrans.update(
            {
              updateBy: updateBy,
              updateByIp: updateByIp,
              verified: 1,
            },
            {
              where: {
                userMasterID: userMasterID,
                AttnYearMon: yearMonth,
              },
              transaction: t,
            }
          );

          // --------------------Attendance Bonus---------------------

          let extraDays = 0;
          const [attendanceBonusPolicy, attBonus_ExtraDays] = await Promise.all(
            [
              EmployeeAttendanceBonusPolicy.findOne({
                raw: true,
                where: {
                  status: 1,
                  userMasterID,
                  startDate: {
                    [Sequelize.Op.lte]: end_date,
                  },

                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.is]: null } },
                    { endDate: { [Sequelize.Op.gte]: end_date } },
                  ],
                },
                include: [
                  {
                    model: AttendanceBonusPolicy,
                  },
                ],
              }),
              Incentivetype.findAll({
                raw: true,
                where: Sequelize.and(
                  Sequelize.where(
                    sequelize.fn(
                      'TRIM',
                      sequelize.fn('LOWER', sequelize.col('incentivetypename'))
                    ),
                    {
                      [Sequelize.Op.in]: ['attendance bonus', 'extra days'],
                    }
                  ),
                  Sequelize.where(
                    sequelize.col('companyMasterID'),
                    joiningdata['userMaster.companyMasterId']
                  ),
                  Sequelize.or(
                    Sequelize.where(sequelize.col('status'), 0),
                    Sequelize.where(sequelize.col('status'), 1)
                  )
                ),
              }),
            ]
          );

          const attBonusTypeIncentive = attBonus_ExtraDays.find(
            (e) =>
              String(e.incentivetypename).trim().toLocaleLowerCase() ==
              'attendance bonus'
          );
          const extraDaysTypeInc = attBonus_ExtraDays.find(
            (e) =>
              String(e.incentivetypename).trim().toLocaleLowerCase() ==
              'extra days'
          );

          let salaryData = [];

          if (attBonusTypeIncentive || extraDaysTypeInc) {
            salaryData = await getUserSalaryMasterByMonth(
              userMasterID,
              yearMonth
            );
          }

          // check condition attendanceBonusPolicy and not set No attendanceBonusPolicy and Attendance Bonus is present in company

          if (
            attendanceBonusPolicy &&
            !attendanceBonusPolicy[
              'attendanceBonusPolicy.setNoattendanceBonusPolicy'
            ] &&
            attBonusTypeIncentive
          ) {
            let eligibleForBonus = false,
              monthly_PaidDays = 0,
              actual_Present = 0,
              slot = null;

            const workingData =
              getAlldata.find((e) => e['hrLeaveType.LeaveID'] == 20) || null;

            // for hourly salary calculation
            if (
              salaryCalculationBasedOn == 'hourwise' &&
              attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'hourly'
            ) {
              const userWorkingMinutes = +workingData?.AttnVal || 0;
              const minAttnBonusMin = Math.round(
                +attendanceBonusPolicy['attendanceBonusPolicy.min_bonus_hrs'] *
                  60
              );

              if (+userWorkingMinutes >= +minAttnBonusMin)
                eligibleForBonus = true;
            }

            // for daily salary calculation

            if (
              salaryCalculationBasedOn != 'hourwise' &&
              attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'daily'
            ) {
              // Set Monthly Paid Days
              if (joiningdata && joiningdata.salaryCalculationAct == 'F') {
                const weekoff = getAlldata
                  .filter((e) => e['hrLeaveType.LeaveID'] == 30)
                  .reduce((acc, obj) => acc + +obj.AttnVal, 0);
                monthly_PaidDays = +monday - +weekoff;
                actual_Present = getAlldata
                  .filter(
                    (e) =>
                      e['hrLeaveType.LeaveID'] == 1 ||
                      e['hrLeaveType.LeaveID'] == 9
                  )
                  .reduce((acc, obj) => acc + +obj.AttnVal, 0);
              } else if (
                joiningdata &&
                joiningdata.salaryCalculationAct == 'W'
              ) {
                const weekoffHoliday = getAlldata
                  .filter(
                    (e) =>
                      e['hrLeaveType.LeaveID'] == 30 ||
                      e['hrLeaveType.LeaveID'] == 31
                  )
                  .reduce((acc, obj) => acc + +obj.AttnVal, 0);
                monthly_PaidDays = +monday - +weekoffHoliday;
                actual_Present = getAlldata
                  .filter((e) => e['hrLeaveType.LeaveID'] == 1)
                  .reduce((acc, obj) => acc + +obj.AttnVal, 0);
              } else {
                monthly_PaidDays = +monday;
                actual_Present = getAlldata
                  .filter(
                    (e) =>
                      e['hrLeaveType.LeaveID'] == 1 ||
                      e['hrLeaveType.LeaveID'] == 7 ||
                      e['hrLeaveType.LeaveID'] == 9
                  )
                  .reduce((acc, obj) => acc + +obj.AttnVal, 0);
              }

              // if set fix days
              if (
                attendanceBonusPolicy['attendanceBonusPolicy.setPresentDay'] ==
                'Fix'
              ) {
                const presentDays = getAlldata.find(
                  (e) => e['hrLeaveType.LeaveID'] == 1
                )
                  ? getAlldata.find((e) => e['hrLeaveType.LeaveID'] == 1)
                      .AttnVal
                  : 0;

                if (
                  attendanceBonusPolicy['attendanceBonusPolicy.slots'] ==
                  'twoSlot'
                ) {
                  if (
                    +presentDays >=
                    +attendanceBonusPolicy[
                      'attendanceBonusPolicy.noofPrentDaySlot2'
                    ]
                  ) {
                    slot = attendanceBonusPolicy['attendanceBonusPolicy.slots'];
                    eligibleForBonus = true;
                  } else {
                    if (
                      +presentDays >=
                      +attendanceBonusPolicy[
                        'attendanceBonusPolicy.noofPrentDay'
                      ]
                    ) {
                      slot = 'oneSlot';
                      eligibleForBonus = true;
                    }
                  }
                } else {
                  if (
                    +presentDays >=
                    +attendanceBonusPolicy['attendanceBonusPolicy.noofPrentDay']
                  ) {
                    slot = 'oneSlot';
                    eligibleForBonus = true;
                  }
                }
              } else if (
                attendanceBonusPolicy['attendanceBonusPolicy.setPresentDay'] ==
                'Half'
              ) {
                if (+monthly_PaidDays / 2 <= +actual_Present)
                  eligibleForBonus = true;
              } else {
                const totalPaidDays = getAlldata
                  .filter(
                    (e) =>
                      e['hrLeaveType.LeaveID'] == 1 ||
                      e['hrLeaveType.LeaveID'] == 7 ||
                      e['hrLeaveType.LeaveID'] == 9
                  )
                  .reduce((acc, obj) => acc + +obj.AttnVal, 0);

                if (+totalPaidDays == +monday) eligibleForBonus = true;
              }
            }

            // check eligibleForBonus is true

            if (eligibleForBonus) {
              let amount = 0;
              const salaryData = await getUserSalaryMasterByMonth(
                userMasterID,
                yearMonth
              );
              const salaryCalculationType =
                salaryData.length > 0 ? salaryData[0].baseOnCalculation : '';
              // for daily salary
              if (
                attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'daily'
              ) {
                const attendnaceBonusType =
                  slot == 'twoSlot'
                    ? attendanceBonusPolicy[
                        'attendanceBonusPolicy.attendanceBonustypeSlot2'
                      ]
                    : attendanceBonusPolicy[
                        'attendanceBonusPolicy.attendanceBonustype'
                      ];

                const attendnaceBonusAmount =
                  slot == 'twoSlot'
                    ? +attendanceBonusPolicy[
                        'attendanceBonusPolicy.attendanceBonusAmountSlot2'
                      ]
                    : +attendanceBonusPolicy[
                        'attendanceBonusPolicy.attendanceBonusAmount'
                      ];

                // if Attendance Bonus Amount is Fixed
                if (
                  attendnaceBonusType == 'Fix' &&
                  salaryCalculationType != 'H'
                ) {
                  amount = +attendnaceBonusAmount;
                } else {
                  extraDays = attendnaceBonusAmount;

                  const grossAmount =
                    salaryData.find((e) => e.payheadMasterId == 50)
                      ?.EmployeeSalaryAmount || 0;

                  // if salaryCalculationType is daywise
                  if (salaryCalculationType == 'D')
                    amount = +grossAmount * attendnaceBonusAmount;
                  // if salaryCalculationType is Month Wise
                  if (salaryCalculationType == 'M') {
                    let perDayAmount = 0;

                    if (salaryCalculationBasedOn == 'daywise')
                      perDayAmount =
                        +grossAmount /
                        +user_salaryPolicy[
                          'salaryPolicy.salaryCalculationDays'
                        ];
                    else {
                      // if salaryCalculationAct set as factory act
                      if (
                        joiningdata &&
                        joiningdata.salaryCalculationAct == 'F'
                      ) {
                        const actualWeekoff = getAlldata.find(
                          (e) => e['hrLeaveType.LeaveID'] == 30
                        );

                        perDayAmount =
                          +grossAmount /
                          (+monday -
                            (actualWeekoff ? +actualWeekoff.AttnVal : 0));
                      } else if (
                        joiningdata &&
                        joiningdata.salaryCalculationAct == 'W'
                      ) {
                        const actualWeekoffHoliday = getAlldata
                          .filter(
                            (e) =>
                              e['hrLeaveType.LeaveID'] == 30 ||
                              e['hrLeaveType.LeaveID'] == 31
                          )
                          .reduce((acc, obj) => acc + obj.AttnVal, 0);

                        perDayAmount =
                          +grossAmount / (+monday - actualWeekoffHoliday);
                      } else {
                        perDayAmount = +grossAmount / +monday;
                      }
                    }

                    amount = perDayAmount * attendnaceBonusAmount;
                  }
                }
              }

              // for houly salary
              if (
                attendanceBonusPolicy['attendanceBonusPolicy.type'] == 'hourly'
              ) {
                let minutes = 0;
                // find trans for shift
                const att = await attendanceTransaction.findOne({
                  where: {
                    userMasterID,
                    AttendanceDate: {
                      [Sequelize.Op.between]: [start_date, end_date],
                    },
                  },
                  order: [['AttendanceDate', 'DESC']],
                });

                if (
                  attendanceBonusPolicy[
                    'attendanceBonusPolicy.bonus_criteria'
                  ] == 'fix'
                )
                  minutes = Math.round(
                    +attendanceBonusPolicy['attendanceBonusPolicy.hours'] * 60
                  );

                if (
                  attendanceBonusPolicy[
                    'attendanceBonusPolicy.bonus_criteria'
                  ] == 'shift'
                ) {
                  minutes = att
                    ? Math.round(
                        +att.Shifthrs *
                          60 *
                          +attendanceBonusPolicy['attendanceBonusPolicy.hours']
                      )
                    : 0;
                }

                let perMinuteGross = 0;

                const grossAmount =
                  salaryData.find((e) => e.payheadMasterId == 50)
                    ?.EmployeeSalaryAmount || 0;

                // if hourly salary structure
                if (salaryCalculationType == 'H')
                  perMinuteGross = +grossAmount / 60;
                // daily salary structure
                if (salaryCalculationType == 'D') {
                  if (user_salaryPolicy['salaryPolicy.dailyFixhours'])
                    perMinuteGross =
                      +grossAmount /
                      (+user_salaryPolicy['salaryPolicy.dailyFixhours'] * 60);

                  if (!user_salaryPolicy['salaryPolicy.dailyFixhours'] && att)
                    perMinuteGross = +grossAmount / (+att.Shifthrs * 60);
                }
                // monthly salary structure
                if (salaryCalculationType == 'M') {
                  const days = calculateDays(start_date, end_date) || 0;

                  if (user_salaryPolicy['salaryPolicy.monthlyFixhours'])
                    perMinuteGross =
                      +grossAmount /
                      (+user_salaryPolicy['salaryPolicy.monthlyFixhours'] * 60);

                  if (
                    user_salaryPolicy['salaryPolicy.dailyFixhours'] &&
                    !user_salaryPolicy['salaryPolicy.monthlyFixhours']
                  )
                    perMinuteGross =
                      +grossAmount /
                      (+user_salaryPolicy['salaryPolicy.dailyFixhours'] *
                        days *
                        60);

                  if (
                    !user_salaryPolicy['salaryPolicy.dailyFixhours'] &&
                    !user_salaryPolicy['salaryPolicy.monthlyFixhours'] &&
                    att
                  )
                    perMinuteGross = +grossAmount / (+att.Shifthrs * days * 60);
                }
                // set minutes and amount
                extraDays = +minutes;
                amount = +perMinuteGross * +minutes;
              }

              const attendanceBonus_leaveType = getAlldata.find(
                (e) => e['hrLeaveType.LeaveID'] == 32
              );

              // if Extra Days is greater than zero
              if (+extraDays > 0 && attendanceBonus_leaveType) {
                await HrLeaveMonthlyTrans.update(
                  {
                    AttnVal: extraDays,
                    verified: 1,
                    updateBy: req.userDetails.userMasterId,
                    updateByIp: req.userDetails.ipAddress,
                  },
                  {
                    where: {
                      userMasterID: userMasterID,
                      AttnYearMon: yearMonth,
                      LeaveTranId: attendanceBonus_leaveType.LeaveTranId,
                    },
                    transaction: t,
                  }
                );
              }

              // if amount is greater than Zero
              if (+amount > 0) {
                // Add Attendance Bonus in Employee Attendance
                await Employeeincentive.create(
                  {
                    userMasterID,
                    yearmonth: yearMonth,
                    amount: Math.round(amount),
                    IncentivetypeID: attBonusTypeIncentive.IncentivetypeID,
                    incentiveDate: end_date,
                    createBy: req.userDetails.userMasterId,
                  },
                  { transaction: t }
                );
              }
            }
          }

          // -------------------Add coff or Extra Days from Attendance Calculation ----------------------

          if (coffValue && coffType) {
            if (coffType == 'AddLeave') {
              const coffLeaveType = AllHrLeaveTypes.find((e) => e.LeaveID == 6);

              if (coffLeaveType) {
                // create leave balance
                const leaveBalance = await HrLeaveBalance.create(
                  {
                    LeaveTranId: coffLeaveType.LeaveTranId,
                    userMasterID,
                    YearMM: yearMonth,
                    LeaveAddNew: +coffValue,
                    createBy: req.userDetails.userMasterId,
                    createByIp: req.userDetails.userIpAddress,
                  },
                  {
                    transaction: t,
                  }
                );

                await coffMaster.create(
                  {
                    LeaveBalTranId: leaveBalance.LeaveBalTranId,
                    LeaveTranId: coffLeaveType.LeaveTranId,
                    userMasterID,
                    LeaveCreatedDate: end_date,
                    YearMM: yearMonth,
                    LeaveAddNew: +coffValue,
                    authorizationStatus: 3,
                    From: 'AC',
                    createBy: req.userDetails.userMasterId,
                    createByIp: req.userDetails.userIpAddress,
                  },
                  {
                    transaction: t,
                  }
                );
              }
            }

            if (coffType == 'AddExtraDays') {
              // Add Extra Days
              await ExtraDays.create(
                {
                  userMasterID,
                  date: end_date,
                  days: +coffValue,
                  employeeincentiveID: null,
                  authorizationStatus: 3,
                  From: 'AC',
                },
                {
                  user: req.userDetails,
                  transaction: t,
                }
              );
            }
          }

          // Extra Days calculation --------------------

          if (extraDaysTypeInc) {
            const extraDaysData = await ExtraDays.findAll({
              where: {
                userMasterID,
                date: {
                  [Sequelize.Op.between]: [start_date, end_date],
                },
                authorizationStatus: 3,
              },
              transaction: t,
            });

            // if extra days data exist
            if (extraDaysData.length) {
              const extraDays = extraDaysData.reduce(
                (acc, obj) => acc + +obj.days,
                0
              );
              const amount = await calculateExtraDays(
                user_salaryPolicy,
                salaryData,
                userMasterID,
                start_date,
                end_date,
                monday,
                joiningdata?.salaryCalculationAct || '',
                getAlldata,
                extraDays
              );
              if (Math.round(+amount) > 0) {
                const addedData = await Employeeincentive.create(
                  {
                    userMasterID,
                    yearmonth: yearMonth,
                    amount: Math.round(amount),
                    IncentivetypeID: extraDaysTypeInc.IncentivetypeID,
                    incentiveDate: end_date,
                    createBy: req.userDetails.userMasterId,
                  },
                  {
                    transaction: t,
                  }
                );
                // update Extra Days
                await ExtraDays.update(
                  {
                    employeeincentiveID: addedData.employeeincentiveID,
                    updateBy: req.userDetails.userMasterId,
                  },
                  {
                    where: {
                      extraDaysID: {
                        [Sequelize.Op.in]: extraDaysData.map(
                          (e) => e.extraDaysID
                        ),
                      },
                    },
                    hooks: false,
                    transaction: t,
                  }
                );
              }
            }
          }

          // hourly overtime request

          const ot_value = await executeQuery(
            `
          select HrLM."AttnVal"  from "hrLeaveMonthlyTrans" as HrLM left outer join 
          "hrLeaveTypes" as HrLT on HrLM."LeaveTranId" = HrLT."LeaveTranId" 
          WHERE HrLT."LeaveID"=21 and HrLM."userMasterID"=` +
              userMasterID +
              ` and HrLM."AttnYearMon"=` +
              yearMonth +
              ` and HrLM."AttnVal">0`
          );

          if (ot_value.length > 0 && joiningdata && joiningdata.overtime == 1) {
            if (overtimeAdded != 'daily') {
              const user_attendancepolicy =
                await EmployeeAttendancePolicy.findOne({
                  where: {
                    status: 1,
                    userMasterID: userMasterID,
                    startDate: {
                      [Sequelize.Op.lte]: end_date,
                    },

                    [Sequelize.Op.or]: [
                      { endDate: { [Sequelize.Op.is]: null } },
                      { endDate: { [Sequelize.Op.gte]: end_date } },
                    ],
                  },
                  include: [
                    {
                      model: AttendancePolicy,
                      as: 'attendancePolicy',
                      // attributes: ['salaryCycleDate']
                    },
                  ],
                });

              let overtimeEntryAfter;

              if (user_attendancepolicy) {
                overtimeEntryAfter =
                  user_attendancepolicy.attendancePolicy.overtimeEntryAfterMin;
              } else {
                overtimeEntryAfter = 0;
              }

              if (overtimeEntryAfter == null || overtimeEntryAfter == '') {
                overtimeEntryAfter = 0;
              }

              if (Number(ot_value[0].AttnVal) > Number(overtimeEntryAfter)) {
                let final_ot_min = Number(ot_value[0].AttnVal);

                let data = {
                  AttendanceTransID: null,
                  UserMasterID: userMasterID,
                  OverTimeDate: end_date,
                  OverTimeIn: null,
                  OverTimeOut: null,
                  OverTimeHourAndMin: final_ot_min,
                  AttendancePolicyID: null,
                  CompanyMasterID: companyMasterID,
                  createBy: updateBy,
                  createByIp: '192.33',
                };

                await overtimeauthorization(data);
              }
            }
          }
        });

        const ot = joiningdata ? joiningdata.overtime : '';

        // condition for Asopalv
        if (
          (companyMasterID == 277 ||
            companyMasterID == 298 ||
            companyMasterID == 300) &&
          ot == 1
        ) {
          const ot_data = await getOTDaysforAsopalav(userMasterID, yearMonth);

          if (+ot_data.minutes > 0) {
            const data = {
              AttendanceTransID: null,
              UserMasterID: userMasterID,
              OverTimeDate: ot_data.date,
              OverTimeIn: null,
              OverTimeOut: null,
              OverTimeHourAndMin: +ot_data.minutes,
              AttendancePolicyID: null,
              CompanyMasterID: companyMasterID,
              createBy: updateBy,
              createByIp: updateByIp,
            };

            await overtimeauthorizationForAsopalav(data);
          }
        }

        // SRI VAISHNAVI RETAIL (INDIA) LLP

        if (companyMasterID == 237) {
          const absentdata = getAlldata.find((e) => e.LeaveTranId == 1471); //leavetranid for absent

          const absent = absentdata ? +absentdata.AttnVal : 0;

          await addThreeDaysExtraAmount(
            userMasterID,
            yearMonth,
            absent,
            updateBy,
            updateByIp,
            end_date
          );

          const branch = await employeeBranch(userMasterID, end_date);

          const branchId = branch ? branch.branchID : '';

          const attendancedata = await getAttendanceData(
            userMasterID,
            start_date,
            end_date,
            false
          );

          // check weekoff payment

          await checkSundayPresentDoublesalary(
            attendancedata,
            userMasterID,
            start_date,
            end_date,
            branchId,
            yearMonth,
            updateBy,
            updateByIp
          );
          await lunchBreakPenaltyForVaishnavi(
            attendancedata,
            end_date,
            updateBy,
            updateByIp
          );
        }
      }
    }

    let message = 'Attendance verified successfully.';

    if (NegativeValue_UserName.length > 0) {
      message = `Attenance not verified of ${NegativeValue_UserName} and other attendance verified successfully.`;
    }

    return res.status(200).json({
      status: 200,
      message: message,
    });
  } catch (err) {
    next(err);
  }
};

exports.unVerifyAllAttendanceCalcution = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      userMasterID,
      yearMonth,
      updateBy,
      updateByIp,
      leftdate,
    } = await req.body;

    const monday = daysInMonth(yearMonth.slice(4, 6), yearMonth.slice(0, 4));

    const [usermaster, AllUserSalary, AllUserAttData, AllCoff] =
      await Promise.all([
        UserMaster.findAll({
          raw: true,
          where: {
            userMasterID: userMasterID,
          },
          include: [{ model: employeeJoiningDetails }],
        }),
        HRSalaryTrasaction.findAll({
          raw: true,
          where: {
            userMasterID: userMasterID,
            salaryYYYYMM: yearMonth,
          },
        }),
        HrLeaveMonthlyTrans.findAll({
          raw: true,
          where: {
            userMasterID: userMasterID,
            AttnYearMon: yearMonth,
            verified: 1,
          },
          include: [{ model: HrLeaveTypes, attributes: ['LeaveID'] }],
        }),
        // Find Coff
        coffMaster.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            YearMM: yearMonth,
            From: 'AC',
          },
        }),
      ]);

    await sequelize.transaction(async (t) => {
      for (let i = 0; i < usermaster.length; i++) {
        const find_salary = AllUserSalary.find(
          (e) =>
            e.userMasterID == usermaster[i].userMasterID &&
            e.salaryYYYYMM == yearMonth
        );

        if (!find_salary) {
          const getAlldata = AllUserAttData.filter(
            (e) =>
              e.userMasterID == usermaster[i].userMasterID &&
              e.AttnYearMon == yearMonth
          );

          let end_date =
            getAlldata.length > 0 && getAlldata[0].monthenddate
              ? getAlldata[0].monthenddate
              : yearMonth.slice(0, 4) +
                '-' +
                yearMonth.slice(4, 6) +
                '-' +
                monday;

          start_date =
            getAlldata.length > 0 && getAlldata[0].monthstartdate
              ? getAlldata[0].monthstartdate
              : yearMonth.slice(0, 4) +
                '-' +
                yearMonth.slice(4, 6) +
                '-' +
                '01';

          const ot_value = await executeQuery(
            `
    select HrLM."AttnVal"  from "hrLeaveMonthlyTrans" as HrLM left outer join 
    "hrLeaveTypes" as HrLT on HrLM."LeaveTranId" = HrLT."LeaveTranId" 
    WHERE HrLT."LeaveID"=21 and HrLM."userMasterID"=` +
              usermaster[i].userMasterID +
              ` and HrLM."AttnYearMon"=` +
              yearMonth +
              ` and HrLM."AttnVal">0`
          );

          // hourly overtime request check
          if (
            ot_value.length > 0 ||
            usermaster[i].companyMasterId == 277 ||
            usermaster[i].companyMasterId == 298 ||
            usermaster[i].companyMasterId == 300
          ) {
            let overtime = await overTimeCalculation.findOne({
              raw: true,
              where: {
                UserMasterID: usermaster[i].userMasterID,
                OverTimeDate: end_date,
              },
            });

            if (
              usermaster[i].companyMasterId == 277 ||
              usermaster[i].companyMasterId == 298 ||
              usermaster[i].companyMasterId == 300
            ) {
              overtime = null;
              overtime = await overTimeCalculation.findOne({
                raw: true,
                where: {
                  UserMasterID: usermaster[i].userMasterID,
                  OverTimeDate: end_date,
                  AttendanceTransID: null,
                },
              });
            }

            if (overtime) {
              if (overtime.AuthorizationRequired == 3) continue;

              await overtimeAuthorizationRequest.destroy(
                {
                  where: {
                    ReferenceID: overtime.OverTimeID,
                  },
                },
                {
                  transaction: t,
                }
              );

              await overTimeCalculation.destroy(
                {
                  where: {
                    OverTimeID: overtime.OverTimeID,
                  },
                },
                {
                  transaction: t,
                }
              );
            }
          }

          // Set Attendance Bonus Days Zero
          const atendnaceBonus = getAlldata.find(
            (e) => e['hrLeaveType.LeaveID'] == 32
          );

          if (atendnaceBonus) {
            await HrLeaveMonthlyTrans.update(
              {
                verified: 0,
                AttnVal: 0,
                updateBy: updateBy,
                updateByIp: updateByIp,
              },
              {
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  AttnYearMon: yearMonth,
                  LeaveTranId: atendnaceBonus.LeaveTranId,
                },
                transaction: t,
              }
            );
          }

          await HrLeaveMonthlyTrans.update(
            {
              updateBy: updateBy,
              updateByIp: updateByIp,
              verified: 0,
            },
            {
              where: {
                userMasterID: usermaster[i].userMasterID,
                AttnYearMon: yearMonth,
              },
              transaction: t,
            }
          );

          // find Extra Days

          const extraDaysData = await ExtraDays.findAll({
            where: {
              userMasterID: usermaster[i].userMasterID,
              date: {
                [Sequelize.Op.between]: [start_date, end_date],
              },
              employeeincentiveID: {
                [Sequelize.Op.ne]: null,
              },
            },
            transaction: t,
          });

          if (
            extraDaysData.length > 0 &&
            extraDaysData[0].employeeincentiveID
          ) {
            await ExtraDays.update(
              {
                employeeincentiveID: null,
                updateBy: req.userDetails.userMasterId,
              },
              {
                where: {
                  extraDaysID: {
                    [Sequelize.Op.in]: extraDaysData.map((e) => e.extraDaysID),
                  },
                },
                transaction: t,
                hooks: false,
              }
            );

            // delete extra days incentives
            await Employeeincentive.destroy({
              where: {
                employeeincentiveID: extraDaysData[0].employeeincentiveID,
              },
              transaction: t,
            });
          }

          // ------------------------------Delete Extra Days and coff -----------------------

          await ExtraDays.destroy({
            where: {
              date: end_date,
              userMasterID: usermaster[i].userMasterID,
              From: 'AC',
            },
            individualHooks: true,
            user: req.userDetails,
            transaction: t,
          });

          // Find Coff
          const findCoff = AllCoff.filter(
            (e) => e.userMasterID == usermaster[i].userMasterID
          );

          if (findCoff.length) {
            const LeaveBalTranIds = findCoff.map((e) => e.LeaveBalTranId);
            if (LeaveBalTranIds.length) {
              // Delete Coff Balance
              await HrLeaveBalance.destroy({
                where: {
                  LeaveBalTranId: {
                    [Sequelize.Op.in]: LeaveBalTranIds,
                  },
                },
                transaction: t,
              });
            }
            // Delete Coff
            await coffMaster.destroy({
              where: {
                coffMasterID: {
                  [Sequelize.Op.in]: findCoff.map((e) => e.coffMasterID),
                },
              },
              transaction: t,
            });
          }

          // SRI VAISHNAVI RETAIL (INDIA) LLP
          if (companyMasterID == 237) {
            // delete three days extra Amount and weekoff payment Amount

            await Employeeincentive.destroy(
              {
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  yearmonth: +yearMonth,
                  IncentivetypeID: [129, 159], //three days extra id 129 and weekoff payment id 159
                },
              },
              { transaction: t }
            );

            // if attendance is verified
            if (getAlldata.length > 0) {
              await EmployeePenalty.destroy(
                {
                  where: {
                    userMasterID: usermaster[i].userMasterID,
                    penaltyDate: getAlldata[0].monthenddate,
                    penaltyID: 64, // Lunch Break Penalty id 64
                  },
                },
                { transaction: t }
              );
            }
          }

          // delete Attendance Bonus

          const dataOfAttendanceBounus = await Employeeincentive.findAll({
            where: {
              userMasterID: usermaster[i].userMasterID,
              yearmonth: yearMonth,
              incentiveDate: end_date,
            },
            include: [
              {
                required: true,
                model: Incentivetype,
                where: Sequelize.and(
                  Sequelize.where(
                    sequelize.fn(
                      'TRIM',
                      sequelize.fn(
                        'LOWER',
                        sequelize.col('incentivetype.incentivetypename')
                      )
                    ),
                    'attendance bonus'
                  )
                ),
              },
            ],
            transaction: t,
          });

          await Employeeincentive.destroy({
            where: {
              employeeincentiveID: dataOfAttendanceBounus.map(
                (e) => e.employeeincentiveID
              ),
            },
            transaction: t,
          });
        }
      }
    });

    res.status(200).json({
      status: 200,
      data: {},
      message: message.usermessage.unvarifyAttendanceCalculation,
    });
  } catch (err) {
    next(err);
  }
};

exports.attendanceSummarybyuserid = async (req, res, next) => {
  try {
    let { userMasterID, month, companyMasterID } = await req.body;

    if (!month) {
      month =
        String(new Date().getFullYear()) +
        String(new Date().getMonth() + 1).padStart(2, '0');
    }

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    const monday = daysInMonth(month.slice(4, 6), month.slice(0, 4));

    const enddate = month.slice(0, 4) + '-' + month.slice(4, 6) + '-' + monday;

    const { startDate, endDate } = getStartAndEndDate(+month);

    const usermaster = await UserMaster.findOne({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
      ...accessibleUsers(req.userDetails, false),
      include: [
        {
          required: false,
          model: HrLeaveMonthlyTrans,
          where: { AttnYearMon: month },
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
          ],
          include: [
            {
              model: hrLeaveTypes,
              attributes: ['LeaveID'],
              include: [
                {
                  model: HrLeaveMaster,
                  as: 'LeaveMaster',
                  attributes: ['LeaveName', 'LeaveDesc'],
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
          model: employeeSalaryPolicies,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(enddate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(enddate),
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
            startDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(startDate) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          required: false,
          attributes: ['attendancePolicyID'],
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
                'showShift',
                'coff',
              ],
            },
          ],
        },
        // weeoffPolicy
        {
          model: EmployeeWeekOff,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(startDate) },
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
        // LCEG Policy
        {
          required: false,
          model: EmployeeLateEarlyPolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(startDate) },
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
            YYYYMM: month,
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

    const AllHrLeaveTypes = await HrLeaveTypes.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      include: [
        {
          model: HrLeaveMaster,
          as: 'LeaveMaster',
          attributes: ['LeaveName', 'LeaveDesc'],
        },
      ],
      order: [['LeaveTranId', 'ASC']],
    });

    const attendancedata = await attendanceCalculation1(
      usermaster,
      month,
      '',
      AllHrLeaveTypes
    );

    if (+attendancedata.length === 0)
      return res.status(200).json({
        message: 'No data found!',
      });

    const unverifiedData = attendancedata.filter((e) => e.verified == 0);

    if (
      unverifiedData.length &&
      unverifiedData[0].user_leave &&
      unverifiedData[0].user_leave.length
    ) {
      const toAddData = [];
      const toAddLCEGPenaltyData = [];

      // for penalty

      for (const penalty of unverifiedData[0]?.penaltyArray || []) {
        toAddLCEGPenaltyData.push({
          userMasterID: unverifiedData[0].userMasterID,
          YYYYMM: +unverifiedData[0].yearMonth,
          penaltyType: penalty.penaltyType,
          penaltyValue: penalty.values,
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
          createBy: createBy,
          createByIp: createByIp,
        });
      }

      //delete data

      await sequelize.transaction(async (t) => {
        await HrLeaveMonthlyTrans.destroy({
          where: {
            userMasterID: userMasterID,
            AttnYearMon: month,
          },
          transaction: t,
        });

        await LCEGPenalty.destroy({
          where: {
            userMasterID: userMasterID,
            YYYYMM: month,
          },
          transaction: t,
        });

        await HrLeaveMonthlyTrans.bulkCreate(toAddData, { transaction: t });
        await LCEGPenalty.bulkCreate(toAddLCEGPenaltyData, {
          individualHooks: true,
          user: req.userDetails,
          transaction: t,
        });
      });
    }

    const finalData = attendancedata.map((e) => {
      const SandwichData = e.user_leave.filter(
        (s) =>
          (s.leaveID == 28 && s.values > 0) || (s.leaveID == 28 && s.values > 0)
      );

      const attendnaceBonus = e.user_leave.filter(
        (a) => a.leaveID == 32 && a.values > 0
      );

      return {
        month: e.month,
        userName: e.userName,
        user_leave:
          SandwichData.length > 0 && attendnaceBonus.length > 0
            ? e.user_leave
            : attendnaceBonus.length > 0
              ? e.user_leave.filter(
                  (s) => ![28, 29, 30, 31].includes(s.leaveID)
                )
              : SandwichData.length > 0
                ? e.user_leave.filter((s) => ![32].includes(s.leaveID))
                : e.user_leave.filter(
                    (s) => ![28, 29, 30, 31, 32].includes(s.leaveID)
                  ),
      };
    });

    return res.status(200).json({
      status: 200,
      data: finalData,
      message: 'Data get successfully.',
    });
  } catch (err) {
    next(err.message);
  }
};

exports.demoCountWiseAttendance = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID, userMasterID, month } = req.body;

    const firstDate = month.slice(0, 4) + '-' + month.slice(4, 6) + '-' + '01';

    const monday = daysInMonth(month.slice(4, 6), month.slice(0, 4));

    const endDate = month.slice(0, 4) + '-' + month.slice(4, 6) + '-' + monday;

    const users = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        ...(userMasterID &&
          userMasterID.length > 0 && {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
          }),
        status: 1,
        [Sequelize.Op.or]: [
          {
            deactiveDate: {
              [Sequelize.Op.gte]: new Date(firstDate),
            },
          },
          {
            deactiveDate: { [Sequelize.Op.eq]: null },
          },
        ],
      },
      ...accessibleUsers(req.userDetails, false, false),
      order: [['displayName', 'ASC']],
      include: [
        {
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(endDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
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
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(endDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
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
          model: EmployeeBranch,
          where: {
            status: 1,
            ...(branchMasterID && { branchID: branchMasterID }),
            applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(endDate) } },
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
          model: EmployeeSalaryPolicy,
          where: {
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
          required: false,
          attributes: ['salaryPolicyID'],
          include: [
            {
              model: SalaryPolicy,
              as: 'salaryPolicy', // Alias
            },
          ],
        },
        {
          required: true,
          model: EmployeeJoiningDetails,
          where: {
            joiningDate: {
              [Sequelize.Op.lte]: new Date(endDate),
            },
            [Sequelize.Op.or]: [
              {
                leavingDate: { [Sequelize.Op.gte]: new Date(firstDate) },
              },
              {
                leavingDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
        },
        {
          model: EmployeeAttendancePolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(firstDate) },
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
                'showShift',
                'coff',
              ],
            },
          ],
        },
        {
          required: false,
          model: HrLeaveMonthlyTrans,
          where: {
            AttnYearMon: month,
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
          ],
          include: [
            {
              model: hrLeaveTypes,
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
        // weeoffPolicy
        {
          model: EmployeeWeekOff,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(firstDate) },
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

        // LCEG Policy
        {
          required: false,
          model: EmployeeLateEarlyPolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(firstDate) },
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
            YYYYMM: month,
          },
        },
      ],
    });

    const newUsers = users.filter(
      (e) =>
        !e.hrLeaveMonthlyTrans ||
        (e.hrLeaveMonthlyTrans && !e.hrLeaveMonthlyTrans.length)
    );

    const AllHrLeaveTypes = await HrLeaveTypes.findAll({
      where: {
        companyMasterID,
        status: 1,
      },
      include: [
        { model: HrLeaveMaster, as: 'LeaveMaster', attributes: ['LeaveName'] },
      ],
      order: [['LeaveTranId', 'ASC']],
    });

    for (const user of newUsers) {
      const attendancedataCal = await attendanceCalculation1(
        user,
        month,
        '',
        AllHrLeaveTypes
      );

      const unverifiedData = attendancedataCal.filter((e) => e.verified == 0);

      if (
        unverifiedData.length &&
        unverifiedData[0].user_leave &&
        unverifiedData[0].user_leave.length
      ) {
        const toAddData = [];
        const toAddLCEGPenaltyData = [];

        // for penalty

        for (const penalty of unverifiedData[0]?.penaltyArray || []) {
          toAddLCEGPenaltyData.push({
            userMasterID: unverifiedData[0].userMasterID,
            YYYYMM: +unverifiedData[0].yearMonth,
            penaltyType: penalty.penaltyType,
            penaltyValue: penalty.values,
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
            createBy: req.userDetails.userMasterId,
            createByIp: req.userDetails.userIpAddress,
          });
        }

        //delete data

        await sequelize.transaction(async (t) => {
          await HrLeaveMonthlyTrans.destroy({
            where: {
              userMasterID: unverifiedData[0].userMasterID,
              AttnYearMon: month,
            },
            transaction: t,
          });

          await LCEGPenalty.destroy({
            where: {
              userMasterID: unverifiedData[0].userMasterID,
              YYYYMM: month,
            },
            transaction: t,
          });

          await HrLeaveMonthlyTrans.bulkCreate(toAddData, { transaction: t });
          await LCEGPenalty.bulkCreate(toAddLCEGPenaltyData, {
            individualHooks: true,
            user: req.userDetails,
            transaction: t,
          });
        });
      }
    }

    const AllUserAttnData = await HrLeaveMonthlyTrans.findAll({
      raw: true,
      where: {
        userMasterID: {
          [Sequelize.Op.in]: users.map((e) => e.userMasterID),
        },
        AttnYearMon: month,
      },
      include: [
        {
          model: hrLeaveTypes,
          where: { LeaveID: { [Sequelize.Op.notIn]: [20, 21, 29, 30, 31] } },
          attributes: [],
          include: [
            { model: HrLeaveMaster, as: 'LeaveMaster', attributes: [] },
          ],
        },
      ],
      attributes: [
        'userMasterID',
        'AttnVal',
        [sequelize.col('hrLeaveType.LeaveID'), 'LeaveID'],
        [sequelize.col('hrLeaveType.LeaveMaster.LeaveName'), 'LeaveName'],
      ],
    });

    const final = await Promise.all(
      users.map((e) => {
        const attendanceData = AllUserAttnData.filter(
          (att) => att.userMasterID == e.userMasterID
        );

        let present, absent, weekoff, holiday, absentDueToSandwhich;

        attendanceData.map((d) => {
          if (d.LeaveID == 1) {
            present = d.AttnVal;
          } else if (d.LeaveID == 5) {
            absent = d.AttnVal;
          } else if (d.LeaveID == 7) {
            weekoff = d.AttnVal;
          } else if (d.LeaveID == 9) {
            holiday = d.AttnVal;
          } else if (d.LeaveID == 28) {
            absentDueToSandwhich = d.AttnVal;
          }
        });

        let tempTotalDays = monday;

        const userSalaryPolicy =
          e.employeeSalaryPolicies && e.employeeSalaryPolicies.length > 0
            ? e.employeeSalaryPolicies[0].salaryPolicy
            : '';

        if (userSalaryPolicy) {
          let salaryCycleDate = userSalaryPolicy.salaryCycleDate;

          salaryCycleDate = (salaryCycleDate < 10 ? '0' : '') + salaryCycleDate;

          let start_date =
            month.slice(0, 4) + '-' + month.slice(4, 6) + '-' + salaryCycleDate;

          // To Check salary consider Month

          if (userSalaryPolicy.salaryCycleConsider == 'E') {
            const tempDate = new Date(start_date);
            tempDate.setMonth(tempDate.getMonth() - 1);

            start_date =
              tempDate.getFullYear() +
              '-' +
              String(tempDate.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(tempDate.getDate()).padStart(2, '0');

            // set Month days
            tempTotalDays = daysInMonth(
              start_date.slice(5, 7),
              start_date.slice(0, 4)
            );
          }
        }

        const obj = {
          'Employee Code': e.employeeJoiningDetails[0].employeeCode,
          'Employee Name': e.displayName,
          'Mobile No.': e.userNumber,
          Branch:
            e.employeeBranches && e.employeeBranches.length > 0
              ? e.employeeBranches[0].branchMaster
                ? e.employeeBranches[0].branchMaster.branchName
                : ''
              : '',
          Department:
            e.employeeDepartments && e.employeeDepartments.length > 0
              ? e.employeeDepartments[0].department
                ? e.employeeDepartments[0].department.departmentName
                : ''
              : '',
          Designation:
            e.employeeDesignations && e.employeeDesignations.length > 0
              ? e.employeeDesignations[0].designation
                ? e.employeeDesignations[0].designation.designationName
                : ''
              : '',
          'OT(Minutes)': '',
          'Month Days': tempTotalDays,
          'Present Days': present == 0 ? 0 : present ? present : '',
          'Absent Days': absent == 0 ? 0 : absent ? absent : '',
          WH: weekoff == 0 ? 0 : weekoff ? weekoff : '',
          PH: holiday == 0 ? 0 : holiday ? holiday : '',
          'Absent Due To Sandwhich': absentDueToSandwhich
            ? absentDueToSandwhich
            : 0,
        };

        const remainingData = attendanceData.filter(
          (e) => ![1, 5, 7, 9, 28].includes(e.LeaveID)
        );

        remainingData.forEach((e) => {
          obj[`${e.LeaveName}`] = e.AttnVal;
        });

        return obj;
      })
    );

    if (+final.length === 0) {
      return res.status(200).json({
        message: 'No data found to export!',
      });
    }

    return generateExcel(final, 'CountWiseAttendance', 'xlsx', res);
  } catch (error) {
    next(error);
  }
};

const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const Employeeincentive = require('../models/employeeincentive');
const EmployeePenalty = require('../models/employeePenalty');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const { log } = require('util');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const EmployeeDepartment = require('../models/employeeDepartment');
const path = require('path');
const e = require('express');
const { min } = require('lodash');
const weekOffPolicy = require('../models/weekOffPolicy');
const { weekoffTypeEnum } = require('../utils/dbUtils');
const coffMaster = require('../models/coffMaster');
const EmployeeLateEarlyPolicy = require('../models/employeeLateEarlyPolicy');
const LateEarlyPolicy = require('../models/lateEarlyPolicy');
const LCEGPenalty = require('../models/lcegPenalty');

exports.uploadCountWiseAttendance = async (req, res, next) => {
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  const transaction = await sequelize.transaction();
  try {
    const { companyMasterID, month, createBy, createByIp } = await req.body;

    const firstDate = month.slice(0, 4) + '-' + month.slice(4, 6) + '-' + '01';

    const monday = daysInMonth(month.slice(4, 6), month.slice(0, 4));
    const lastDate = month.slice(0, 4) + '-' + month.slice(4, 6) + '-' + monday;

    const leavetype = await hrLeaveTypes.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      transaction,
    });

    let aTranId,
      pTranId,
      wTranId,
      hTranId,
      a_due_To_Sandwhich_TranId,
      whTranId,
      otTranId;

    leavetype.map((e) => {
      if (e.LeaveID == 1) {
        pTranId = e.LeaveTranId;
      } else if (e.LeaveID == 5) {
        aTranId = e.LeaveTranId;
      } else if (e.LeaveID == 7) {
        wTranId = e.LeaveTranId;
      } else if (e.LeaveID == 9) {
        hTranId = e.LeaveTranId;
      } else if (e.LeaveID == 22) {
        penTranId = e.LeaveTranId;
      } else if (e.LeaveID == 20) {
        whTranId = e.LeaveTranId;
      } else if (e.LeaveID == 21) {
        otTranId = e.LeaveTranId;
      } else if (e.LeaveID == 28) {
        a_due_To_Sandwhich_TranId = e.LeaveTranId;
      }
    });

    readXlsxFile(filePath).then(async (rows) => {
      rows.shift();

      const toAddData = [];
      const toUpdateData = [];
      const toAddOt = [];

      const AllUserNumbers = rows.map((e) => String(e[2]));

      const AllUsers = await UserMaster.findAll({
        where: {
          userNumber: {
            [Sequelize.Op.in]: AllUserNumbers,
          },
          status: 1,
          companyMasterId: companyMasterID,
        },
        include: [
          {
            required: false,
            model: EmployeeSalaryPolicy,
            where: {
              status: 1,
              startDate: {
                [Sequelize.Op.lte]: new Date(lastDate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: { [Sequelize.Op.gte]: new Date(lastDate) },
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
            required: false,
            model: HrLeaveMonthlyTrans,
            where: {
              AttnYearMon: month,
            },
            include: [
              {
                model: HrLeaveTypes,
                where: {
                  LeaveID: {
                    [Sequelize.Op.notIn]: [29, 30, 31],
                  },
                },
                attributes: ['LeaveID'],
              },
            ],
          },
        ],
        transaction,
      });

      const userSalary = HRSalaryTrasaction.findAll({
        where: {
          userMasterID: AllUsers.map((e) => e.userMasterID),
          salaryYYYYMM: month,
        },
        transaction,
      });

      const otCal = overTimeCalculationMain.findAll({
        where: {
          userMasterID: AllUsers.map((e) => e.userMasterID),
          yyyymm: +month,
        },
        transaction,
      });

      const [allUserSalary, All_OT_CAl] = await Promise.all([
        userSalary,
        otCal,
      ]);

      const allUserIds = [];

      for (const row of rows) {
        const presentdata = row[8] && typeof row[8] === 'number' ? row[8] : 0;
        const absentdata = row[9] && typeof row[9] === 'number' ? row[9] : 0;
        const whdata = row[10] && typeof row[10] === 'number' ? row[10] : 0;
        const phdata = row[11] && typeof row[11] === 'number' ? row[11] : 0;
        const a_due_To_Sandwhichdata =
          row[12] && typeof row[12] === 'number' ? row[12] : 0;

        const otData = row[6] && typeof row[6] === 'number' ? row[6] : 0;

        if (
          +presentdata < 0 ||
          +absentdata < 0 ||
          +whdata < 0 ||
          +phdata < 0 ||
          +otData < 0 ||
          +a_due_To_Sandwhichdata < 0
        ) {
          await transaction.rollback();
          return res.status(200).json({
            status: 401,
            message: 'Value Should be positive of Leave Type:' + `'${row[2]}'`,
          });
        }

        if (
          presentdata ||
          absentdata ||
          whdata ||
          phdata ||
          a_due_To_Sandwhichdata
        ) {
          const user = AllUsers.find(
            (e) => String(e.userNumber) == String(row[2])
          );

          if (!user) continue;

          allUserIds.push(user.userMasterID);

          const salary = allUserSalary.find(
            (e) => e.userMasterID == user.userMasterID
          );

          if (salary) {
            await transaction.rollback();
            return res.status(200).json({
              status: 401,
              message: 'Salary already calculated for ' + `'${row[2]}'`,
            });
          }

          const hrleaveData =
            user.hrLeaveMonthlyTrans && user.hrLeaveMonthlyTrans.length > 0
              ? user.hrLeaveMonthlyTrans
              : [];

          const allLeaveSum = hrleaveData
            .filter(
              (e) => ![1, 5, 7, 9, 20, 21, 28].includes(e.hrLeaveType.LeaveID)
            )
            .reduce((acc, obj) => acc + +obj.AttnVal, 0);

          if (
            +row[7] <
            +presentdata +
              +absentdata +
              +whdata +
              +phdata +
              +a_due_To_Sandwhichdata +
              +allLeaveSum
          ) {
            await transaction.rollback();
            return res.status(200).json({
              status: 401,
              message: 'Month Days value does not match for ' + `'${row[2]}'`,
            });
          }

          const salaryPolicy =
            user.employeeSalaryPolicies &&
            user.employeeSalaryPolicies.length > 0
              ? user.employeeSalaryPolicies[0]
              : null;

          let tempMonthDays = monday;

          let start_date = firstDate,
            end_date = lastDate;

          if (salaryPolicy) {
            let date = salaryPolicy.salaryPolicy.salaryCycleDate;

            date = (date < 10 ? '0' : '') + date;

            start_date =
              month.slice(0, 4) + '-' + month.slice(4, 6) + '-' + date;

            // To Check salary consider Month

            if (salaryPolicy.salaryPolicy.salaryCycleConsider == 'E') {
              const tempDate = new Date(start_date);
              tempDate.setMonth(tempDate.getMonth() - 1);

              start_date =
                tempDate.getFullYear() +
                '-' +
                String(tempDate.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(tempDate.getDate()).padStart(2, '0');

              // set Month days
              tempMonthDays = daysInMonth(
                start_date.slice(5, 7),
                start_date.slice(0, 4)
              );
            }

            let date1 = new Date(start_date);
            date1.setDate(date1.getDate() + (tempMonthDays - 1));

            end_date =
              date1.getFullYear() +
              '-' +
              String(date1.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date1.getDate()).padStart(2, '0');
          }

          // Present

          if (typeof row[8] === 'number') {
            const attData = hrleaveData.find((e) => e.LeaveTranId == pTranId);

            if (attData) {
              toUpdateData.push({
                AttnTranId: attData.AttnTranId,
                AttnVal: presentdata,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                updateBy: createBy,
                updateByIp: createByIp,
              });
            } else {
              toAddData.push({
                userMasterID: user.userMasterID,
                LeaveTranId: pTranId,
                AttnYearMon: +month,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[8],
                createBy: createBy,
                createByIp: createByIp,
                verified: 1,
              });
            }
          }

          // Absent

          if (typeof row[9] === 'number') {
            const attData = hrleaveData.find((e) => e.LeaveTranId == aTranId);

            if (attData) {
              toUpdateData.push({
                AttnTranId: attData.AttnTranId,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[9],
                updateBy: createBy,
                updateByIp: createByIp,
              });

              // await HrLeaveMonthlyTrans.update({ AttnVal: row[6], updateBy: createBy, updateByIp: createByIp }, { where: { AttnTranId: attData } })
            } else {
              toAddData.push({
                userMasterID: user.userMasterID,
                LeaveTranId: aTranId,
                AttnYearMon: +month,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[9],
                createBy: createBy,
                createByIp: createByIp,
                verified: 1,
              });
            }
          }

          // Weekoff

          if (typeof row[10] === 'number') {
            const attData = hrleaveData.find((e) => e.LeaveTranId == wTranId);

            if (attData) {
              toUpdateData.push({
                AttnTranId: attData.AttnTranId,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[10],
                updateBy: createBy,
                updateByIp: createByIp,
              });
            } else {
              toAddData.push({
                userMasterID: user.userMasterID,
                LeaveTranId: wTranId,
                AttnYearMon: +month,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[10],
                createBy: createBy,
                createByIp: createByIp,
                verified: 1,
              });
            }
          }

          // Holiday

          if (typeof row[11] === 'number') {
            const attData = hrleaveData.find((e) => e.LeaveTranId == hTranId);

            if (attData) {
              toUpdateData.push({
                AttnTranId: attData.AttnTranId,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[11],
                updateBy: createBy,
                updateByIp: createByIp,
              });

              // await HrLeaveMonthlyTrans.update({ AttnVal: row[6], updateBy: createBy, updateByIp: createByIp }, { where: { AttnTranId: attData } })
            } else {
              toAddData.push({
                userMasterID: user.userMasterID,
                LeaveTranId: hTranId,
                AttnYearMon: +month,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[11],
                createBy: createBy,
                createByIp: createByIp,
                verified: 1,
              });
            }
          }

          // Holiday

          if (typeof row[12] === 'number') {
            const attData = hrleaveData.find(
              (e) => e.LeaveTranId == a_due_To_Sandwhich_TranId
            );

            if (attData) {
              toUpdateData.push({
                AttnTranId: attData.AttnTranId,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[12],
                updateBy: createBy,
                updateByIp: createByIp,
              });

              // await HrLeaveMonthlyTrans.update({ AttnVal: row[6], updateBy: createBy, updateByIp: createByIp }, { where: { AttnTranId: attData } })
            } else {
              toAddData.push({
                userMasterID: user.userMasterID,
                LeaveTranId: a_due_To_Sandwhich_TranId,
                AttnYearMon: +month,
                MonDays: row[7],
                MonWorkDays: +row[7] - (+whdata + +phdata),
                monthstartdate: start_date,
                monthenddate: end_date,
                AttnVal: row[12],
                createBy: createBy,
                createByIp: createByIp,
                verified: 1,
              });
            }
          }

          await HrLeaveMonthlyTrans.destroy({
            where: {
              LeaveTranId: {
                [Sequelize.Op.in]: [whTranId, otTranId],
              },
              AttnYearMon: month,
              userMasterID: user.userMasterID,
            },
            transaction,
          });

          if (row[6] && typeof row[6] === 'number') {
            const clculated_ot = All_OT_CAl.find(
              (e) => e.userMasterID == user.userMasterID
            );

            if (clculated_ot) {
              await transaction.rollback();
              return res.status(200).json({
                status: 401,
                message:
                  'Overtime already calculated for' +
                  `'${row[2]}'.` +
                  'Delete overtime calculation to add overtime.',
              });
            }

            const overtime = await overTimeCalculation.findAll({
              where: {
                UserMasterID: user.userMasterID,
                OverTimeDate: {
                  [Sequelize.Op.between]: [start_date, end_date],
                },
              },
              transaction,
            });

            const otids = overtime.map((e) => +e.OverTimeID);

            await overtimeAuthorizationRequest.destroy({
              where: {
                ReferenceID: {
                  [Sequelize.Op.in]: otids,
                },
              },
              transaction,
            });

            await overTimeCalculation.destroy({
              where: {
                OverTimeID: {
                  [Sequelize.Op.in]: otids,
                },
                UserMasterID: user.userMasterID,
              },
              transaction,
            });

            const overtimeData = {
              CompanyMasterID: user.companyMasterId,
              UserMasterID: user.userMasterID,
              OverTimeDate: end_date,
              UpdateOverTimeHourAndMin: +row[6],
              OverTimeHourAndMin: +row[6],
              AuthorizationRequired: 3,
              createBy: createBy,
              createByIp: createByIp,
            };

            toAddOt.push(overtimeData);
          }
        }
      }

      await HrLeaveMonthlyTrans.bulkCreate(toAddData, { transaction });

      await overTimeCalculation.bulkCreate(toAddOt, { transaction });

      await Promise.all(
        toUpdateData.map(async (data) => {
          HrLeaveMonthlyTrans.update(
            {
              MonDays: data.MonDays,
              MonWorkDays: data.MonWorkDays,
              AttnVal: data.AttnVal,
              updateBy: data.updateBy,
              updateByIp: data.updateByIp,
              verified: 1,
              monthstartdate: data.monthstartdate,
              monthenddate: data.monthenddate,
            },
            { where: { AttnTranId: data.AttnTranId }, transaction }
          );
        })
      );

      await HrLeaveMonthlyTrans.update(
        {
          verified: 1,
          updateBy: req.userDetails.userMasterId,
          updateByIp: req.userDetails.ipAddress,
        },
        {
          where: {
            userMasterID: allUserIds,
            AttnYearMon: month,
          },
          transaction,
        }
      );

      fs.unlink(filePath, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('delete');
        }
      });

      await transaction.commit();
      return res.status(200).send({
        status: 200,
        message: ' The File Upload Successfully: ' + req.file.originalname,
      });
    });
  } catch (error) {
    fs.unlink(filePath, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('delete');
      }
    });
    await transaction.rollback();
    next(error);
  }
};

exports.listMonthlyAttendanceEntry = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID, YYYYMM, Export } = req.body;

    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const CurrentMonth = currentDate.slice(0, 7).replace('-', '');

    if (+YYYYMM > +CurrentMonth) {
      return res.status(200).json({
        status: 401,
        message: 'You cannot select a future month.',
      });
    }

    const year = String(YYYYMM).slice(0, 4);
    const month = String(YYYYMM).slice(4, 6);

    const enddate = year + '-' + month + '-' + daysInMonth(month, year);

    const AllUserData = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        status: 1,
      },
      include: [
        {
          required: false,
          model: HrLeaveMonthlyTrans,
          where: {
            AttnYearMon: YYYYMM,
            verified: 1,
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
              model: hrLeaveTypes,
              attributes: ['LeaveID'],
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
          model: employeeSalaryPolicies,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(enddate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(enddate),
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
            startDate: { [Sequelize.Op.lte]: new Date(enddate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(enddate) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          required: false,
          attributes: ['attendancePolicyID'],
          include: [
            {
              model: AttendancePolicy,
              as: 'attendancePolicy',
              attributes: ['attendancePolicyID', 'WHPHPriority'],
            },
          ],
        },

        {
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(enddate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(enddate) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          required: false,
          attributes: ['designationID'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationName', 'designationId'],
            },
          ],
        },
        {
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(enddate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(enddate) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          required: false,
          attributes: ['departmentID'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentName', 'departmentId'],
            },
          ],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            ...(branchMasterID && { branchID: branchMasterID }),
            applicableDate: { [Sequelize.Op.lte]: new Date(enddate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(enddate) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          required: branchMasterID ? true : false,
          attributes: ['branchID'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
              attributes: ['branchName', 'branchMasterID'],
            },
          ],
        },
        {
          model: EmployeeWeekOff,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(enddate) },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(enddate) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          required: false,
          attributes: ['weekOffPolicyID'],
          include: [
            {
              model: weekOffPolicy,
              as: 'weekoff',
            },
          ],
        },
        {
          separate: true,
          required: false,
          model: HRSalaryTrasaction,
          where: {
            salaryYYYYMM: YYYYMM,
          },
          limit: 1,
        },
      ],
      attributes: [
        'userMasterID',
        'displayName',
        'userNumber',
        'companyMasterId',
      ],
      order: [['displayName', 'ASC']],
    });

    const finalData = [];

    for (const data of AllUserData) {
      const userMasterID = data.userMasterID;

      // Employee joining Details
      const empjoining = data.employeeJoiningDetails?.[0] || null;

      // Attendance calculation data
      const userAttnCalData = data.hrLeaveMonthlyTrans || [];

      const obj = {
        ...(!Export && { userMasterID }),
        EmployeeCode: empjoining?.employeeCode || '',
        EmployeeName: data.displayName,
        UserNumber: data.userNumber,
        Branch: data.employeeBranches?.[0]?.branchMaster?.branchName || '',
        Department:
          data.employeeDepartments?.[0]?.department?.departmentName || '',
        Designation:
          data.employeeDesignations?.[0]?.designation?.designationName || '',
        StartDate: '',
        EndDate: '',
        salaryPolicyType: 'monthwise',
        salaryCalculated: false,
        totalDays: null,
        leavesArray: [],
        Weekoffvalue: 0,
        weekoffPolicyType: '',
        monday: null,
        verified: 0,
      };

      let monday = daysInMonth(month, year);

      obj.totalDays = monday;

      //--------------------------Employee salary policy ----------------------

      const user_salaryPolicy =
        data.employeeSalaryPolicies?.[0]?.salaryPolicy || null;

      let end_date,
        start_date,
        salaryPolicyType = '';

      // ----------- set start date and end date according to salary policy -------

      if (user_salaryPolicy) {
        let date = user_salaryPolicy.salaryCycleDate;
        salaryPolicyType = user_salaryPolicy.salarycalculationBasedon;

        date = (date < 10 ? '0' : '') + date;

        start_date = year + '-' + month + '-' + date;

        // To Check salary consider Month

        if (user_salaryPolicy.salaryCycleConsider == 'E') {
          const tempDate = new Date(start_date);
          tempDate.setMonth(tempDate.getMonth() - 1);

          start_date =
            tempDate.getFullYear() +
            '-' +
            String(tempDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(tempDate.getDate()).padStart(2, '0');

          // set Month days
          monday = daysInMonth(start_date.slice(5, 7), start_date.slice(0, 4));
        }

        let date1 = new Date(start_date);
        date1.setDate(date1.getDate() + (monday - 1));

        end_date =
          date1.getFullYear() +
          '-' +
          String(date1.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date1.getDate()).padStart(2, '0');
      } else {
        start_date = year + '-' + month + '-' + '01';
        end_date = year + '-' + month + '-' + monday;
      }

      let joining = false;

      if (empjoining) {
        if (
          empjoining.joiningDate > start_date &&
          empjoining.joiningDate <= end_date
        ) {
          start_date = empjoining.joiningDate;
        }
        // not join yet
        if (empjoining.joiningDate > end_date) {
          continue;
        }

        // end date
        if (empjoining.leavingDate) {
          if (
            empjoining.leavingDate < end_date &&
            empjoining.leavingDate >= start_date
          ) {
            end_date = empjoining.leavingDate;
          }
          // left employee
          if (empjoining.leavingDate < start_date) {
            continue;
          }
        }

        if (start_date > end_date) {
          continue;
        } else {
          joining = true;
        }
      }

      // if not joining
      if (!joining) continue;

      // set salary Policy Type
      obj.salaryPolicyType = salaryPolicyType;

      //set monthdays

      obj.monday = monday;

      // get Weekoff Policy
      const weekoffPolicy = data.employeeWeekOffs?.[0]?.weekoff || null;
      // weekoff Policy Type
      const weekoffPolicyType = weekoffPolicy?.weekoffType || null;

      obj.weekoffPolicyType = weekoffPolicyType;

      // set weekoff Policy type
      if (
        weekoffPolicy &&
        weekoffPolicyType &&
        !weekoffPolicy.isNoWeekoffPolicy
      ) {
        if (weekoffPolicyType == weekoffTypeEnum.MONTHLYFIX)
          obj.Weekoffvalue = weekoffPolicy.monthlyFix;
        if (weekoffPolicyType == weekoffTypeEnum.ONPRESENTDAY)
          obj.Weekoffvalue = weekoffPolicy.presentDays;
      }

      // if attendance calculation is verified

      if (userAttnCalData && userAttnCalData.length) {
        // set startdate and endDate
        (obj.StartDate = userAttnCalData[0].monthstartdate),
          (obj.EndDate = userAttnCalData[0].monthenddate);

        if (Export) {
          obj.StartDate = obj.StartDate.split('-').reverse().join('-');
          obj.EndDate = obj.EndDate.split('-').reverse().join('-');
        }

        obj.totalDays = getDaysFromDates(
          userAttnCalData[0].monthstartdate,
          userAttnCalData[0].monthenddate
        );

        obj['Present'] =
          userAttnCalData.find((e) => e.hrLeaveType.LeaveID == 1)?.AttnVal || 0;
        obj['Absent'] =
          userAttnCalData.find((e) => e.hrLeaveType.LeaveID == 5)?.AttnVal || 0;
        obj['WeekOff'] =
          userAttnCalData.find((e) => e.hrLeaveType.LeaveID == 7)?.AttnVal || 0;
        obj['Holiday'] =
          userAttnCalData.find((e) => e.hrLeaveType.LeaveID == 9)?.AttnVal || 0;

        // filter Array leave types
        const leaveArray = userAttnCalData.filter(
          (e) =>
            ![1, 5, 7, 9, 20, 21, 22, 29, 30, 31, 32].includes(
              e.hrLeaveType.LeaveID
            )
        );

        const paidLeaves = leaveArray
          .filter((e) => ![28, 18].includes(e.hrLeaveType.LeaveID))
          .reduce((acc, obj) => acc + +obj.AttnVal, 0);
        const unpaidLeaves = leaveArray
          .filter((e) => [28, 18].includes(e.hrLeaveType.LeaveID))
          .reduce((acc, obj) => acc + +obj.AttnVal, 0);

        obj['PaidLeaves'] = +paidLeaves || 0;
        obj['UnPaidLeaves'] = +unpaidLeaves || 0;

        obj.leavesArray = leaveArray.map((e) => {
          return {
            LeaveTranId: e.LeaveTranId,
            value: e.AttnVal,
          };
        });

        obj.verified = 1;

        // get salary data
        const salaryData = data.hrSalaryTrasactions || [];

        if (salaryData.length) obj.salaryCalculated = true;

        if (Export) {
          delete obj.Weekoffvalue;
          delete obj.salaryPolicyType;
          delete obj.salaryCalculated;
          delete obj.weekoffPolicyType;
          delete obj.totalDays;
          delete obj.monday;
          delete obj.leavesArray;
          delete obj.verified;
        }

        finalData.push(obj);

        continue;
      }

      // set startdate and endDate
      (obj.StartDate = start_date), (obj.EndDate = end_date);

      if (Export) {
        obj.StartDate = obj.StartDate.split('-').reverse().join('-');
        obj.EndDate = obj.EndDate.split('-').reverse().join('-');
      }

      // set total days

      obj.totalDays = getDaysFromDates(start_date, end_date);

      let weekoffCount = 0;
      let findWeekoff = true;

      const WH_Condition = {
        userMasterID: userMasterID,
        date: {
          [Sequelize.Op.between]: [start_date, end_date],
        },
        tableName: 'holiday',
        [Sequelize.Op.and]: Sequelize.literal(`(date, "tableName") IN (
          SELECT date, "tableName"
          FROM "weekoffHolidayTrans"
          WHERE "userMasterID" = ${userMasterID}
            AND date BETWEEN '${start_date}' AND '${end_date}'
            AND ("optionalHoliday" IS FALSE OR "optionalHoliday" IS NULL) AND "tableName"='holiday'
          GROUP BY date,"tableName"
        )`),
      };

      // find Weekoff
      if (
        weekoffPolicy &&
        weekoffPolicyType &&
        !weekoffPolicy.isNoWeekoffPolicy
      ) {
        // if monthly fix weekoff or on present days
        if (
          [weekoffTypeEnum.MONTHLYFIX, weekoffTypeEnum.ONPRESENTDAY].includes(
            weekoffPolicyType
          )
        ) {
          weekoffCount =
            weekoffPolicyType == weekoffTypeEnum.MONTHLYFIX
              ? +weekoffPolicy.monthlyFix
              : 0;
          findWeekoff = false;
        }

        // if fix weekoff
        if (weekoffPolicyType == weekoffTypeEnum.FIX) {
          //delete tablename
          delete WH_Condition.tableName;

          const weekOffHolidayPriority =
            data.employeeAttendancePolicies?.[0]?.attendancePolicy
              ?.WHPHPriority || null;

          const typeCondition =
            weekOffHolidayPriority === 'PH' ? "'holiday'" : "'weekoff'";

          WH_Condition[Sequelize.Op.and] =
            Sequelize.literal(`(date, "tableName") IN (
              SELECT date, 
                     CASE 
                       WHEN SUM(CASE WHEN "tableName" = 'weekoff' THEN 1 ELSE 0 END) > 0 
                            AND SUM(CASE WHEN "tableName" = 'holiday' THEN 1 ELSE 0 END) > 0 
                       THEN MAX(CASE WHEN "tableName" = ${typeCondition} THEN "tableName" END)
                       ELSE MAX("tableName") 
                     END AS selected_tableName
              FROM "weekoffHolidayTrans"
              WHERE "userMasterID" = ${userMasterID}
                AND date BETWEEN '${start_date}' AND '${end_date}'
                AND ("optionalHoliday" IS FALSE OR "optionalHoliday" IS NULL)
              GROUP BY date
            )`);
        }
      }
      // find weekoff holiday and leave data
      const [weekoffholidays, leave] = await Promise.all([
        weekoffHolidayTran.findAll({
          raw: true,
          where: WH_Condition,
          order: [
            ['date', 'ASC'],
            ['tableName', 'DESC'],
          ],
        }),
        UserLeaveTransaction.findAll({
          where: {
            date: {
              [Sequelize.Op.between]: [start_date, end_date],
            },
            status: 1,
          },
          include: [
            {
              required: true,
              model: UserLeave,
              where: { userMasterID: userMasterID, status: 1 },
              attributes: ['DayType'],
            },
            {
              required: true,
              model: HrLeaveTypes,
              attributes: ['LeaveID'],
            },
          ],
        }),
      ]);

      // if find weekoff is true
      if (findWeekoff) {
        const finalWeekoffs = checkLeaveOnWH(
          leave,
          weekoffholidays.filter((e) => e.tableName == 'weekoff')
        );
        weekoffCount = finalWeekoffs.reduce((acc, obj) => acc + +obj.value, 0);
      }

      // get holidays
      const finalHolidays = checkLeaveOnWH(
        leave,
        weekoffholidays.filter((e) => e.tableName == 'holiday')
      );

      const holidayCount = finalHolidays.reduce(
        (acc, obj) => acc + +obj.value,
        0
      );

      const paidLeaves = leave
        .filter((e) => ![5, 18].includes(e.hrLeaveType.LeaveID))
        .reduce((acc, obj) => acc + +obj.days, 0);
      const unpaidLeaves = leave
        .filter((e) => [5, 18].includes(e.hrLeaveType.LeaveID))
        .reduce((acc, obj) => acc + +obj.days, 0);

      const totalLeaves = +paidLeaves + +unpaidLeaves;

      obj['Present'] = !Export ? null : '';
      obj['Absent'] =
        +obj.totalDays - (+weekoffCount + +holidayCount + +totalLeaves) > 0
          ? +obj.totalDays - (+weekoffCount + +holidayCount + +totalLeaves)
          : 0;
      obj['WeekOff'] = +weekoffCount || 0;
      obj['Holiday'] = +holidayCount || 0;
      obj['PaidLeaves'] = +paidLeaves || 0;
      obj['UnPaidLeaves'] = +unpaidLeaves || 0;
      obj.leavesArray = leave.map((e) => {
        return {
          LeaveTranId: e.LeaveTranId,
          value: e.days,
        };
      });

      if (Export) {
        delete obj.Weekoffvalue;
        delete obj.salaryPolicyType;
        delete obj.salaryCalculated;
        delete obj.weekoffPolicyType;
        delete obj.totalDays;
        delete obj.monday;
        delete obj.leavesArray;
        delete obj.verified;
      }

      finalData.push(obj);
    }

    if (Export)
      return await generateExcel(finalData, 'Monthly Attendance', 'xlsx', res);

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: finalData.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.saveMonthlyAttendanceEntry = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { dataArray = [], companyMasterID, YYYYMM } = req.body;

    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const CurrentMonth = currentDate.slice(0, 7).replace('-', '');

    if (+YYYYMM > +CurrentMonth) {
      return res.status(200).json({
        status: 401,
        message: 'You cannot select a future month.',
      });
    }

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    const AllUserIds = dataArray.map((e) => e.userMasterID);

    // find salary Data

    const [salaryData, AllHrleaveTypes] = await Promise.all([
      HRSalaryTrasaction.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: AllUserIds,
          },
          salaryYYYYMM: YYYYMM,
        },
        group: ['userMasterID', 'salaryYYYYMM'],
        attributes: ['userMasterID', 'salaryYYYYMM'],
      }),
      HrLeaveTypes.findAll({
        where: {
          companyMasterID,
          status: 1,
          LeaveID: {
            [Sequelize.Op.notIn]: [20, 21, 22],
          },
        },
        order: [['LeaveTranId', 'ASC']],
      }),
    ]);

    const finalDataToAdd = [];

    const userMasterIds = [];

    const salaryCalculatedUser = [];

    for (const data of dataArray) {
      const userMasterID = data.userMasterID;

      if (salaryData.find((e) => e.userMasterID == userMasterID)) {
        salaryCalculatedUser.push(data.EmployeeName);
        continue;
      }

      // Validate attendance days
      const totalCalculatedDays =
        +data.Present +
        +data.Absent +
        +data.WeekOff +
        +data.Holiday +
        +data.PaidLeaves +
        +data.UnPaidLeaves;
      if (+data.totalDays !== totalCalculatedDays) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `Attendance days mismatch for ${data.employeeName}. Please check.`,
        });
      }

      userMasterIds.push(userMasterID);

      // if present is null then only delete data not add

      if (data.Present == null) continue;

      const leavesArray = data.leavesArray || [];

      for (const leaveType of AllHrleaveTypes) {
        const leaveID = leaveType.LeaveID;
        const LeaveTranId = leaveType.LeaveTranId;
        let AttnVal = 0;

        switch (leaveID) {
          case 1:
            AttnVal = +data.Present;
            break;
          case 5:
            AttnVal = +data.Absent;
            break;
          case 7:
          case 30:
            AttnVal = +data.WeekOff;
            break;
          case 9:
          case 31:
            AttnVal = +data.Holiday;
            break;
          case 29:
          case 32:
            AttnVal = 0;
            break;
          default:
            // Sum value from leavesArray for matching leave type
            AttnVal = leavesArray
              .filter((l) => l.LeaveTranId == LeaveTranId)
              .reduce((sum, l) => sum + +l.value, 0);
            break;
        }

        finalDataToAdd.push({
          userMasterID,
          AttnYearMon: YYYYMM,
          LeaveTranId,
          MonDays: data.monday,
          MonWorkDays: data.totalDays,
          AttnVal,
          createBy,
          createByIp,
          updateBy: createBy,
          updateByIp: createByIp,
          verified: 1,
          monthstartdate: data.StartDate,
          monthenddate: data.EndDate,
        });
      }
    }

    // delete All Previous Data
    await HrLeaveMonthlyTrans.destroy({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterIds,
        },
        AttnYearMon: YYYYMM,
      },
      transaction,
    });

    // Add all Attendance data
    await HrLeaveMonthlyTrans.bulkCreate(finalDataToAdd, { transaction });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: salaryCalculatedUser.length
        ? `Salary calulated for ${salaryCalculatedUser.join(',')} and other data save successfully.`
        : 'Data save successfully.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.deleteMonthlyAttendanceEntry = async (req, res, next) => {
  try {
    const { userMasterID = [], YYYYMM } = req.body;

    if (!Array.isArray(userMasterID) || userMasterID.length === 0 || !YYYYMM) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }

    const AllSalary = await HRSalaryTrasaction.findAll({
      raw: true,
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
        salaryYYYYMM: YYYYMM,
      },
      include: [
        {
          model: UserMaster,
          attributes: [],
        },
      ],
      group: [
        'hrSalaryTrasaction.userMasterID',
        'hrSalaryTrasaction.salaryYYYYMM',
        'userMaster.displayName',
        'userMaster.userMasterID',
      ],
      attributes: [
        'hrSalaryTrasaction.userMasterID',
        'hrSalaryTrasaction.salaryYYYYMM',
        'userMaster.displayName',
      ],
    });

    const salaryCalulatedUser = AllSalary.filter((e) =>
      userMasterID.includes(+e.userMasterID)
    );

    if (salaryCalulatedUser.length) {
      return res.status(200).json({
        status: 401,
        message: `Salary already calculated for ${salaryCalulatedUser.map((e) => e.displayName).join(',')} `,
      });
    }

    await HrLeaveMonthlyTrans.destroy({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
        AttnYearMon: YYYYMM,
      },
    });

    return res.status(200).json({
      status: 200,
      message: `Attendance Entry deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
