const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('../models/userMaster');

const { executeQuery } = require('./common.controller');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');

const { promisify } = require('util');
const { data } = require('../config/logger');
const read = promisify(require('fs').readFile);
const pdf_options = { format: 'A4', quality: 300 };
const path = require('path');
const fs = require('fs');
var converter = require('number-to-words');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const attendanceTransaction = require('../models/attendanceTransaction');

const manualOldAttendance = require('../models/manualOldAttendance');
const EmployeeBranch = require('../models/employeeBranch');
const OvertimeAuthorizationRequest = require('../models/overtimeAuthorization');
const shiftTime = require('../models/shiftTime');
const shiftModel = require('../models/shift');
const moment = require('moment');
const UserMaster = require('../models/userMaster');
const overTimeCalculation = require('../models/overTimeCalculation');
const UserLeaves = require('../models/userleave');
const Branch = require('../models/branchMaster');
const coffMaster = require('../models/coffMaster');
const AttendanceLogs = require('../models/attendancelogs');
const xlsx = require('xlsx');
const HrleaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const e = require('cors');
const AttendanceCorrection = require('../models/attendanceCorrection');
const Employeeincentive = require('../models/employeeincentive');
const EmployeePenalties = require('../models/employeePenalty');

const {
  daysInMonth,
  formatAMPM,
  checkHoliday,
  addCoff,
  overtime,
  employeeBranch,
  employeeDepartment,
  employeeAttendancePolicy,
  employeeShift,
  employeeDesignation,
  coffOvertime,
  employeeSalaryPolicy,
  calculateEarlyby,
  lateEarlyPenaltyManual,
  asiaKolkataDateTime,
  manualAttendnace_Latest,
} = require('../utils/commonUtilFunctions');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const Designation = require('../models/designation');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const EmployeeShift = require('../models/employeeShift');
const Shift = require('../models/shift');
const { create, isArray } = require('lodash');

async function createlogs(data, logType, InLog, OutLog, transaction) {
  const condition = { AttendanceTransID: data.AttendanceTransID };

  if (InLog || OutLog) condition.direction = InLog ? 'in' : 'out';

  if (InLog && !OutLog) {
    const findOutLog = await AttendanceLogs.findOne({
      where: {
        AttendanceTransID: data.AttendanceTransID,
        direction: 'out',
      },
      transaction,
      order: [['logDateTime', 'DESC']],
    });

    await AttendanceLogs.destroy({
      where: {
        AttendanceTransID: data.AttendanceTransID,
        ...(findOutLog && {
          attendanceLogID: {
            [Sequelize.Op.notIn]: [findOutLog.attendanceLogID],
          },
        }),
      },
      transaction,
    });

    await AttendanceLogs.create(
      {
        userMasterID: data.userMasterID,
        AttendanceTransID: data.AttendanceTransID,
        logDateTime: data.InDatetime,
        direction: 'in',
        photo: 'url',
        attendnaceFrom: logType,
        longitude: logType,
        latitude: logType,
        address: logType,
        createBy: data.createBy,
        createByIp: data.createByIp,
      },
      { transaction }
    );
  }

  if (!InLog && OutLog) {
    const findInLog = await AttendanceLogs.findOne({
      where: {
        AttendanceTransID: data.AttendanceTransID,
        direction: 'in',
      },
      order: [['logDateTime', 'ASC']],
    });

    await AttendanceLogs.destroy({
      where: {
        AttendanceTransID: data.AttendanceTransID,
        ...(findInLog && {
          attendanceLogID: {
            [Sequelize.Op.notIn]: [findInLog.attendanceLogID],
          },
        }),
      },
      transaction,
    });

    if (data.OutDateTime) {
      insert_db = await AttendanceLogs.create(
        {
          userMasterID: data.userMasterID,
          AttendanceTransID: data.AttendanceTransID,

          logDateTime: data.OutDateTime,
          direction: 'out',
          photo: 'url',
          attendnaceFrom: logType,
          longitude: logType,
          latitude: logType,
          address: logType,
          createBy: data.createBy,
          createByIp: data.createByIp,
        },
        { transaction }
      );
    }
  }

  if (InLog && OutLog) {
    await AttendanceLogs.destroy({
      where: {
        AttendanceTransID: data.AttendanceTransID,
      },
      transaction,
    });

    await AttendanceLogs.create(
      {
        userMasterID: data.userMasterID,
        AttendanceTransID: data.AttendanceTransID,
        logDateTime: data.InDatetime,
        direction: 'in',
        photo: 'url',
        attendnaceFrom: logType,
        longitude: logType,
        latitude: logType,
        address: logType,
        createBy: data.createBy,
        createByIp: data.createByIp,
      },
      { transaction }
    );

    if (data.OutDateTime) {
      await AttendanceLogs.create(
        {
          userMasterID: data.userMasterID,
          AttendanceTransID: data.AttendanceTransID,

          logDateTime: data.OutDateTime,
          direction: 'out',
          photo: 'url',
          attendnaceFrom: logType,
          longitude: logType,
          latitude: logType,
          address: logType,
          createBy: data.createBy,
          createByIp: data.createByIp,
        },
        { transaction }
      );
    }
  }
}
exports.getAlldata = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      branchMasterID,
      userMasterID,
      date,
      shift,
      attendancetype,
    } = await req.body;

    let maindata = [];
    let usermaster;
    let date1 = date.slice(0, 4);
    let date2 = date.slice(5, 7);
    let finaldate = date1.concat(date2);
    let currentdate = new Date().toISOString();

    if (new Date(currentdate) < new Date(date)) {
      return res.status(200).json({
        status: 400,
        message: 'You can not add attendance in future date.  ',
      });
    } else {
      if (userMasterID != '') {
        usermaster = await EmployeeBranch.findAll({
          raw: true,
          where: {
            status: 1,
            '$branchMaster.companyMasterID$': companyMasterID,
            userMasterID: userMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(date),
            },

            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.eq]: null } },
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            ],
          },
          include: [
            {
              model: Branch,
              as: 'branchMaster',
            },
            {
              model: userMaster,
              as: 'employee',
              required: true,
              ...accessibleUsers(req.userDetails),
            },
          ],
        });

        if (+usermaster.length == 0) {
          return res.status(200).json({
            status: 400,
            message: 'Branch is not assign On this date',
          });
        }
      } else {
        usermaster = await EmployeeBranch.findAll({
          raw: true,
          where: {
            status: 1,
            branchID: branchMasterID,
            '$branchMaster.companyMasterID$': companyMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(date),
            },

            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.eq]: null } },
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            ],
          },
          include: [
            {
              model: Branch,
              as: 'branchMaster',
            },
            {
              model: userMaster,
              as: 'employee',
              required: true,
              ...accessibleUsers(req.userDetails),
            },
          ],
        });
      }

      let attendanceData = [];

      for (var i = 0; i < usermaster.length; i++) {
        const emp_details = await EmployeeJoiningDetails.findOne({
          raw: true,
          where: {
            '$userMaster.status$': 1,
            userMasterID: usermaster[i].userMasterID,
            joiningDate: {
              [Sequelize.Op.lte]: date,
            },

            [Sequelize.Op.or]: [
              { leavingDate: { [Sequelize.Op.eq]: null } },
              { leavingDate: { [Sequelize.Op.gte]: date } },
              {
                leavingDate: {
                  [Sequelize.Op.eq]: '',
                },
              },
            ],
          },
          include: [{ model: UserMaster }],
        });
        if (emp_details) {
          const user_salaryPolicy = await employeeSalaryPolicy(
            usermaster[i].userMasterID,
            date
          );

          let start_Date;
          let end_Date;

          const month = Number(date.slice(5, 7));
          const year = Number(date.slice(0, 4));
          const monday = daysInMonth(month, year);

          if (user_salaryPolicy) {
            const date2 = user_salaryPolicy['salaryPolicy.salaryCycleDate'];

            const salary_startdate = date2 < 10 ? '0' + date2 : date2;

            start_Date = date.slice(0, 8) + salary_startdate;

            let date1 = new Date(start_Date);
            date1.setDate(date1.getDate() + (monday - 1));

            end_Date =
              date1.getFullYear() +
              '-' +
              String(date1.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date1.getDate()).padStart(2, '0');
          } else {
            start_Date = date.slice(0, 8) + '01';

            end_Date = date.slice(0, 8) + monday;
          }

          if (start_Date > date) {
            let date1 = new Date(start_Date);
            date1.setMonth(date1.getMonth() - 1);

            start_Date =
              date1.getFullYear() +
              '-' +
              String(date1.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date1.getDate()).padStart(2, '0');
          } else if (end_Date < date) {
            let date1 = new Date(start_Date);
            date1.setMonth(date1.getMonth() + 1);

            start_Date =
              date1.getFullYear() +
              '-' +
              String(date1.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date1.getDate()).padStart(2, '0');
          }

          const yearmonth = start_Date.slice(0, 4) + start_Date.slice(5, 7);

          const attendance_verified = await HrleaveMonthlyTrans.findOne({
            where: {
              userMasterID: usermaster[i].userMasterID,
              AttnYearMon: yearmonth,
              verified: 1,
            },
          });

          let Attendance_Verify;

          if (attendance_verified) {
            Attendance_Verify = true;
          } else {
            Attendance_Verify = false;
          }

          let emp_desig = await EmployeeDesignation.findOne({
            where: {
              status: 1,
              userMasterID: usermaster[i].userMasterID,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(date),
              },

              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.eq]: null } },
                { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              ],
            },
          });
          const assign_desig = emp_desig ? emp_desig.designationID : null;

          // if (emp_desig) {
          //   assign_desig = emp_desig.designationID;
          // } else {
          //   assign_desig = 0;
          // }

          let emp_depart = await EmployeeDepartment.findOne({
            where: {
              status: 1,
              userMasterID: usermaster[i].userMasterID,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(date),
              },

              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.eq]: null } },
                { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              ],
            },
          });
          const assign_depart = emp_depart ? emp_depart.departmentID : null;

          // if (emp_depart) {
          //   assign_depart = emp_depart.departmentID;
          // } else {
          //   assign_depart = 0;
          // }

          let attendance_data;

          attendance_data = await attendanceTransaction.findOne({
            where: {
              userMasterID: usermaster[i].userMasterID,

              AttendanceDate: date,
              Status: 1,
            },
          });

          if (attendancetype == '1') {
            let day = new Date(date).toLocaleString('en-us', {
              weekday: 'long',
            });
            let get_options = await shiftTime.findOne({
              where: {
                shiftID: shift,
                day: day,
              },
            });

            if (attendance_data) {
              attendanceData.push({
                attendanceTransid: attendance_data.AttendanceTransID,
                Name: emp_details['userMaster.displayName'],
                Userid: usermaster[i].userMasterID,
                attendance_date: date,
                punchInTime: attendance_data.InDatetime
                  ? new Date(attendance_data.InDatetime).toLocaleString()
                  : null,
                punchOutTime: attendance_data.OutDateTime
                  ? new Date(attendance_data.OutDateTime).toLocaleString()
                  : null,
                present: attendance_data.fulldayhalfday,
                Shift: shift,
                Shifthrs: get_options.totalhours,
                ShiftHalfdayHrs: get_options.totalhourshalfday,
                ShiftIntime: get_options.statTime,
                ShiftoutTime: get_options.endtime,
                halfday: get_options.firsthalfendtime,
                department: assign_depart,
                branch: usermaster[i].branchID,
                designation: assign_desig,
                Attendance_Verify: Attendance_Verify,
              });
            } else {
              attendanceData.push({
                attendanceTransid: '',
                Name: emp_details['userMaster.displayName'],
                Userid: usermaster[i].userMasterID,
                attendance_date: date,
                punchInTime: '',
                punchOutTime: '',
                present: '',
                Shift: shift,
                Shifthrs: get_options.totalhours,
                ShiftHalfdayHrs: get_options.totalhourshalfday,
                ShiftIntime: get_options.statTime,
                ShiftoutTime: get_options.endtime,
                halfday: get_options.firsthalfendtime,
                department: assign_depart,
                branch: usermaster[i].branchID,
                designation: assign_desig,
                Attendance_Verify: Attendance_Verify,
              });
            }
          } else {
            if (attendance_data) {
              let day = new Date(date).toLocaleString('en-us', {
                weekday: 'long',
              });
              let get_options = await shiftTime.findOne({
                where: {
                  shiftID: attendance_data.Shift,
                  day: day,
                },
              });
              attendanceData.push({
                attendanceTransid: attendance_data.AttendanceTransID,
                Name: emp_details['userMaster.displayName'],
                Userid: usermaster[i].userMasterID,
                attendance_date: date,
                punchInTime: attendance_data.InDatetime
                  ? new Date(attendance_data.InDatetime).toLocaleString()
                  : null,
                punchOutTime: attendance_data.OutDateTime
                  ? new Date(attendance_data.OutDateTime).toLocaleString()
                  : null,
                present: attendance_data.fulldayhalfday,
                Shift: attendance_data.Shift,
                ShiftHalfdayHrs: get_options
                  ? get_options.totalhourshalfday
                  : '',
                Shifthrs: attendance_data.Shifthrs,
                ShiftIntime: attendance_data.ShiftIntime,
                ShiftoutTime: attendance_data.ShiftoutTime,
                halfday: get_options ? get_options.firsthalfendtime : '',
                department: assign_depart,
                branch: usermaster[i].branchID,
                designation: assign_desig,
                Attendance_Verify: Attendance_Verify,
              });
            } else {
              attendanceData.push({
                attendanceTransid: '',
                Name: emp_details['userMaster.displayName'],
                Userid: usermaster[i].userMasterID,
                attendance_date: date,
                punchInTime: '',
                punchOutTime: '',
                present: '',
                Shift: '',
                Shifthrs: '',
                ShiftHalfdayHrs: '',
                ShiftIntime: '',
                ShiftoutTime: '',
                halfday: '',
                department: assign_depart,
                branch: usermaster[i].branchID,
                designation: assign_desig,
                Attendance_Verify: Attendance_Verify,
              });
            }
          }
        }
      }

      attendanceData = attendanceData.sort(function (a, b) {
        var textA = a.Name.toUpperCase();
        var textB = b.Name.toUpperCase();

        return textA.localeCompare(textB);
      });

      res.status(200).json({
        status: 200,
        data: attendanceData,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getAlldata_V2 = async (req, res, next) => {
  try {
    let { companyMasterID, userMasterID, date } = await req.body;

    let date1 = date.slice(0, 4);
    let date2 = date.slice(5, 7);
    let finaldate = date1.concat(date2);

    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (new Date(currentdate) < new Date(date)) {
      return res.status(200).json({
        status: 400,
        message:
          'Attendance cannot be recorded for a future date. Please select a valid date.',
      });
    }

    const usermaster = await userMaster.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
        status: 1,
      },
      order: [['displayName', 'ASC']],
      include: [
        {
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['designationID'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationId', 'designationName'],
            },
          ],
        },
        {
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['departmentID'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentId', 'departmentName'],
            },
          ],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['branchID'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
              attributes: ['branchMasterID', 'branchName'],
            },
          ],
        },
        {
          model: EmployeeSalaryPolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          separate: true,
          attributes: ['salaryPolicyID'],
          include: [
            {
              model: SalaryPolicy,
              as: 'salaryPolicy',
              attributes: ['salaryCycleDate', 'salaryCycleConsider'],
            },
          ],
        },
        {
          required: false,
          model: attendanceTransaction,
          where: {
            AttendanceDate: date,
          },
          include: [
            {
              model: AttendanceLogs,
              order: [['logDateTime', 'ASC']],
            },
          ],
        },
        {
          required: true,
          model: EmployeeJoiningDetails,
          attributes: ['employeeCode'],
        },
        {
          model: EmployeeShift,
          attributes: ['shiftsID'],
        },
      ],
    });

    const findAllShift = await Shift.findAll({
      where: {
        companyMasterID,
        status: 1,
      },
      include: [{ model: shiftTime }],
    });

    function formatDate(dateObj) {
      return (
        dateObj.getFullYear() +
        '-' +
        String(dateObj.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(dateObj.getDate()).padStart(2, '0')
      );
    }

    function adjustMonth(dateObj, monthOffset) {
      dateObj.setMonth(dateObj.getMonth() + monthOffset);
      return dateObj;
    }

    const attendanceData = [];

    for (let i = 0; i < usermaster.length; i++) {
      const user_salaryPolicy =
        usermaster[i].employeeSalaryPolicies &&
        usermaster[i].employeeSalaryPolicies.length > 0
          ? usermaster[i].employeeSalaryPolicies[0].salaryPolicy
          : null;

      let start_Date;
      let end_Date;

      const month = Number(date.slice(5, 7));
      const year = Number(date.slice(0, 4));
      const monday = daysInMonth(month, year);

      if (user_salaryPolicy) {
        start_Date =
          date.slice(0, 8) +
          (user_salaryPolicy.salaryCycleDate < 10 ? '0' : '') +
          user_salaryPolicy.salaryCycleDate;

        const date1 = new Date(start_Date);
        date1.setDate(date1.getDate() + (monday - 1));

        end_Date = formatDate(date1);
      } else {
        start_Date = date.slice(0, 8) + '01';
        end_Date = date.slice(0, 8) + monday;
      }

      if (new Date(start_Date) > new Date(date)) {
        const previousMonthStart = adjustMonth(new Date(start_Date), -1);
        start_Date = formatDate(previousMonthStart);

        const previousMonthEnd = adjustMonth(new Date(end_Date), -1);
        end_Date = formatDate(previousMonthEnd);
      } else if (new Date(end_Date) < new Date(date)) {
        const nextMonthStart = adjustMonth(new Date(start_Date), 1);
        start_Date = formatDate(nextMonthStart);

        const nextMonthEnd = adjustMonth(new Date(start_Date), 1);
        end_Date = formatDate(nextMonthEnd);
      }

      const yearmonth =
        user_salaryPolicy && user_salaryPolicy.salaryCycleConsider == 'E'
          ? end_Date.slice(0, 4) + end_Date.slice(5, 7)
          : start_Date.slice(0, 4) + start_Date.slice(5, 7);

      const attendance_verified = await HrleaveMonthlyTrans.findOne({
        where: {
          userMasterID: usermaster[i].userMasterID,
          AttnYearMon: yearmonth,
          verified: 1,
        },
      });

      const attendnace_Data =
        usermaster[i].attendanceTransactions &&
        usermaster[i].attendanceTransactions.length > 0
          ? usermaster[i].attendanceTransactions[0]
          : null;

      const attendanceLog =
        attendnace_Data && isArray(attendnace_Data.attendancelogs)
          ? attendnace_Data.attendancelogs.map((e) => {
              e.dataValues.logDateTime = new Date(
                e.dataValues.logDateTime
              ).toLocaleString();
              return e;
            })
          : [];

      const department =
        usermaster[i].employeeDepartments &&
        usermaster[i].employeeDepartments.length > 0
          ? usermaster[i].employeeDepartments[0].department
          : '';
      const designation =
        usermaster[i].employeeDesignations &&
        usermaster[i].employeeDesignations.length > 0
          ? usermaster[i].employeeDesignations[0].designation
          : '';
      const branch =
        usermaster[i].employeeBranches &&
        usermaster[i].employeeBranches.length > 0
          ? usermaster[i].employeeBranches[0].branchMaster
          : '';

      const employeeShifts =
        usermaster[i].employeeShifts && usermaster[i].employeeShifts.length > 0
          ? usermaster[i].employeeShifts[0]
          : null;

      // const employeeShiftList =
      //   employeeShifts &&
      //   employeeShifts.shiftsID.length > 0 &&
      //   Array.isArray(employeeShifts.shiftsID)
      //     ? findAllShift.filter((item) =>
      //         employeeShifts.shiftsID.includes(String(item.shiftID))
      //       )
      //     : findAllShift;

      const isPresent =
        attendnace_Data &&
        employeeShifts &&
        Array.isArray(employeeShifts.shiftsID)
          ? employeeShifts.shiftsID.includes(attendnace_Data.Shift)
          : false;

      attendanceData.push({
        attendanceTransid: attendnace_Data
          ? attendnace_Data.AttendanceTransID
          : null,
        Name: usermaster[i].displayName,
        employeeCode: usermaster[i].employeeJoiningDetails[0].employeeCode,
        number: usermaster[i].userNumber,
        Userid: usermaster[i].userMasterID,
        attendance_date: date,
        punchInTime:
          attendnace_Data && attendnace_Data.InDatetime
            ? new Date(attendnace_Data.InDatetime).toLocaleString()
            : null,
        punchOutTime:
          attendnace_Data && attendnace_Data.OutDateTime
            ? new Date(attendnace_Data.OutDateTime).toLocaleString()
            : null,
        attendanceType: attendnace_Data ? +attendnace_Data.fulldayhalfday : 0,
        Shift: attendnace_Data ? +attendnace_Data.Shift : null,
        employeeShiftIds: employeeShifts ? employeeShifts.shiftsID : null,
        shiftList: findAllShift,
        toShowSelectedShift: isPresent,
        IN_Change: false,
        OUT_Change: false,
        department: department ? department.departmentName : null,
        branch: branch ? branch.branchName : null,
        designation: designation ? designation.designationName : null,
        Attendance_Verify: attendance_verified ? true : false,
        branchMasterID: branch ? branch.branchMasterID : null,
        departmentId: department ? department.departmentId : null,
        designationId: designation ? designation.designationId : null,
        attendanceLogs: attendanceLog,
      });
    }

    res.status(200).json({
      status: 200,
      data: attendanceData,
      // shiftData: findAllShift,
    });
  } catch (err) {
    next(err);
  }
};

exports.addmanualAttendance_V2 = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { attendanceType, finaldataarray, companyMasterID } = await req.body;

    if (finaldataarray.length === 0) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Attendance Data is required!',
      });
    }

    // const companyid = companyMasterID;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    const responseMesage = await manualAttendnace_Latest(
      attendanceType,
      finaldataarray,
      companyMasterID,
      createBy,
      createByIp,
      transaction
    );

    await transaction.commit();

    return res.status(200).json(responseMesage);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

async function uploadexcelpunchinpunchout(req) {
  if (req.body.direction == 'in') {
    let attendanceDate = new Date(req.body.date).toISOString().slice(0, 10);

    let branch = employeeBranch(req.body.userMasterID, attendanceDate);

    // For New Punchin
    if (req.body.newpunchin == true) {
      let shift = await employeeShift(
        req.body.userMasterID,
        attendanceDate,
        new Date(req.body.date)
      );
      // Find Active Data

      let get_one_data1 = await employeeAttendancePolicy(
        req.body.userMasterID,
        req.body.date
      );

      let attendance;
      if (get_one_data1) {
        attendance = get_one_data1;
      } else {
        attendance = null;
      }

      if (attendance != null) {
        if (attendance.automaticAssignShift == 0) {
          if (shift) {
            let day = new Date(req.body.date).toLocaleString('en-us', {
              weekday: 'long',
            });
            let get_options = await shiftTime.findOne({
              where: {
                shiftID: shift.shiftID,
                day: day,
              },
            }); // Find shift time options

            let date = formatAMPM(new Date(req.body.date)); // Current Time

            var startTime = moment(date, 'HH:mm a'); // Moment Current Time
            var endTime = moment(get_options.statTime, 'HH:mm: a'); // Moment Shift Start Time

            var duration = moment.duration(startTime.diff(endTime)); // Difference Two Times
            var hours = parseInt(duration.asHours()); // Calculate Hours
            hours = hours * 60; // Calculate Hours in min
            var minutes = (parseInt(duration.asMinutes()) % 60) + hours; // Calculate Min + Hours

            // If minutes greater than 0 lateby=minutes
            let lateby;
            if (minutes > 0) {
              lateby = minutes;
            } else {
              lateby = '';
            }

            let penalty;
            let penaltydeduction;

            let departments = await employeeDepartment(
              req.body.userMasterID,
              req.body.date
            );
            let department = departments;

            let assigndepartment;
            if (department) {
              assigndepartment = department.departmentID;
            } else {
              assigndepartment = null;
            }
            //Designation

            let designation = await employeeDesignation(
              req.body.userMasterID,
              req.body.date
            );

            let assigndesignation;
            if (designation) {
              assigndesignation = designation.designationID;
            } else {
              assigndesignation = null;
            }

            if (branch) {
              branch = branch.branchID;
            } else {
              branch = null;
            }

            let insert_db_status = await attendanceTransaction.create({
              userMasterID: req.body.userMasterID,
              departmentID: assigndepartment,
              designationID: assigndesignation,
              branchID: branch,
              InDatetime: new Date(req.body.date),
              AttendanceDate: new Date(req.body.date1)
                .toISOString()
                .slice(0, 10),
              Shift: shift.shiftID,
              Shifthrs: get_options.totalhours,
              ShiftIntime: get_options.statTime,
              ShiftoutTime: get_options.endtime,
              LateBy: lateby,
              Panalty: penalty,
              PanaltyDeduction: penaltydeduction,
              createBy: req.body.createBy,
              createByIp: req.body.createByIp,
            });
          } else {
            return 404;
          }
        } else {
          //  Check shift
          if (shift) {
            let day = new Date(req.body.date).toLocaleString('en-us', {
              weekday: 'long',
            });
            let get_options = await shiftTime.findOne({
              where: {
                shiftID: shift.shiftID,
                day: day,
              },
            }); // Find shift time options

            let date = formatAMPM(new Date(req.body.date)); // Current Time

            var startTime = moment(date, 'HH:mm a'); // Moment Current Time
            var endTime = moment(get_options.statTime, 'HH:mm: a'); // Moment Shift Start Time

            var duration = moment.duration(startTime.diff(endTime)); // Difference Two Times
            var hours = parseInt(duration.asHours()); // Calculate Hours
            hours = hours * 60; // Calculate Hours in min
            var minutes = (parseInt(duration.asMinutes()) % 60) + hours; // Calculate Min + Hours

            // If minutes greater than 0 lateby=minutes
            let lateby;
            if (minutes > 0) {
              lateby = minutes;
            } else {
              lateby = '';
            }

            let penalty;
            let penaltydeduction;

            let departments = await employeeDepartment(
              req.body.userMasterID,
              req.body.date
            );
            let department = departments;
            let assigndepartment;
            if (department) {
              assigndepartment = department.departmentID;
            } else {
              assigndepartment = null;
            }
            //Designation

            let designation = await employeeDesignation(
              req.body.userMasterID,
              req.body.date
            );

            let assigndesignation;
            if (designation) {
              assigndesignation = designation.designationID;
            } else {
              assigndesignation = null;
            }

            if (branch) {
              branch = branch.branchID;
            } else {
              branch = null;
            }
            let insert_db_status = await attendanceTransaction.create({
              userMasterID: req.body.userMasterID,
              departmentID: assigndepartment,
              designationID: assigndesignation,
              branchID: branch,
              InDatetime: new Date(req.body.date),
              AttendanceDate: new Date(req.body.date1)
                .toISOString()
                .slice(0, 10),
              Shift: shift.shiftID,
              Shifthrs: get_options.totalhours,
              ShiftIntime: get_options.statTime,
              ShiftoutTime: get_options.endtime,
              LateBy: lateby,
              Panalty: penalty,
              PanaltyDeduction: penaltydeduction,
              createBy: req.body.createBy,
              createByIp: req.body.createByIp,
            });
            // Insert In AttendanceLogs
          } else {
            let day = new Date(req.body.date).toLocaleString('en-us', {
              weekday: 'long',
            });
            let company = await UserMaster.findOne({
              where: {
                userMasterID: req.body.userMasterID,
              },
            });

            //department
            let departments = await employeeDepartment(
              req.body.userMasterID,
              req.body.date
            );
            let department = departments;
            let assigndepartment;
            if (department) {
              assigndepartment = department.departmentID;
            } else {
              assigndepartment = null;
            }

            //Designation
            let designation = await employeeDesignation(
              req.body.userMasterID,
              req.body.date
            );

            let assigndesignation;
            if (designation) {
              assigndesignation = designation.designationID;
            } else {
              assigndesignation = null;
            }

            //Branch
            if (branch) {
              branch = branch.branchID;
            } else {
              branch = null;
            }

            let get_options = [];
            if (branch && assigndepartment && assigndesignation) {
              get_options = await shiftTime.findAll({
                where: {
                  day: day,
                  '$shift.companyMasterID$': company.companyMasterId,
                  '$shift.status$': 1,
                  '$shift.branchID$': branch,
                  [Sequelize.Op.or]: [
                    {
                      [Sequelize.Op.and]: [
                        { '$shift.table$': 'designations' },
                        { '$shift.referenceId$': assigndesignation },
                      ],
                    },
                    {
                      [Sequelize.Op.and]: [
                        { '$shift.table$': 'departments' },
                        { '$shift.referenceId$': assigndepartment },
                      ],
                    },
                  ],
                },
                include: [
                  {
                    model: shiftModel,
                    as: 'shift',
                  },
                ],
              });
            } else if (branch && assigndepartment) {
              get_options = await shiftTime.findAll({
                where: {
                  day: day,
                  '$shift.companyMasterID$': company.companyMasterId,
                  '$shift.status$': 1,
                  '$shift.branchID$': branch,
                  '$shift.table$': 'departments',
                  '$shift.referenceId$': assigndepartment,
                },
                include: [
                  {
                    model: shiftModel,
                    as: 'shift',
                  },
                ],
              });
            } else if (branch && assigndesignation) {
              get_options = await shiftTime.findAll({
                where: {
                  day: day,
                  '$shift.companyMasterID$': company.companyMasterId,
                  '$shift.status$': 1,
                  '$shift.branchID$': branch,
                  '$shift.table$': 'designations',
                  '$shift.referenceId$': assigndesignation,
                },
                include: [
                  {
                    model: shiftModel,
                    as: 'shift',
                  },
                ],
              });
            }

            if (get_options.length == 0) {
              get_options = await shiftTime.findAll({
                where: {
                  day: day,
                  '$shift.companyMasterID$': company.companyMasterId,
                  '$shift.status$': 1,
                  '$shift.branchID$': {
                    [Sequelize.Op.eq]: null,
                  },

                  [Sequelize.Op.or]: [
                    {
                      '$shift.table$': {
                        [Sequelize.Op.eq]: null,
                      },
                    },
                    {
                      '$shift.table$': '',
                    },
                  ],

                  [Sequelize.Op.or]: [
                    {
                      '$shift.referenceId$': {
                        [Sequelize.Op.eq]: null,
                      },
                    },
                    {
                      '$shift.referenceId$': 0,
                    },
                  ],
                },
                include: [
                  {
                    model: shiftModel,
                    as: 'shift',
                  },
                ],
              });
            }

            if (get_options.length > 0) {
              for (var i = 0; i < get_options.length; i++) {
                let date = formatAMPM(new Date(req.body.date));
                var startTime = moment(date, 'HH:mm a');
                var endTime = moment(get_options[i].statTime, 'HH:mm: a');
                var duration = moment.duration(startTime.diff(endTime));
                var hours = parseInt(duration.asHours());
                hours = hours * 60;
                var minutes = Math.abs(
                  (parseInt(duration.asMinutes()) % 60) + hours
                );
                get_options[i].dataValues.min = minutes;
              }
              get_options.sort(function (a, b) {
                return a.dataValues.min - b.dataValues.min;
              });

              let date = formatAMPM(new Date(req.body.date));
              var startTime = moment(date, 'HH:mm a');
              var endTime = moment(get_options[0].statTime, 'HH:mm: a');
              var duration = moment.duration(startTime.diff(endTime));
              var hours = parseInt(duration.asHours());
              hours = hours * 60;
              var minutes = (parseInt(duration.asMinutes()) % 60) + hours;
              let lateby;
              if (minutes > 0) {
                lateby = minutes;
              } else {
                lateby = '';
              }

              let penalty;
              let penaltydeduction;

              let insert_db_status = await attendanceTransaction.create({
                userMasterID: req.body.userMasterID,
                InDatetime: new Date(req.body.date),
                departmentID: assigndepartment,
                designationID: assigndesignation,
                branchID: branch,
                AttendanceDate: new Date(req.body.date1)
                  .toISOString()
                  .slice(0, 10),
                Shift: get_options[0].shift.shiftID,
                Shifthrs: get_options[0].totalhours,
                ShiftIntime: get_options[0].statTime,
                ShiftoutTime: get_options[0].endtime,
                Panalty: penalty,
                PanaltyDeduction: penaltydeduction,
                LateBy: lateby,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              });
            } else {
              return 404;
            }
          }
        }
      } else {
        //  Check shift
        if (shift) {
          let day = new Date(req.body.date).toLocaleString('en-us', {
            weekday: 'long',
          });
          let get_options = await shiftTime.findOne({
            where: {
              shiftID: shift.shiftID,
              day: day,
            },
          }); // Find shift time options

          let date = formatAMPM(new Date(req.body.date)); // Current Time

          var startTime = moment(date, 'HH:mm a'); // Moment Current Time
          var endTime = moment(get_options.statTime, 'HH:mm: a'); // Moment Shift Start Time

          var duration = moment.duration(startTime.diff(endTime)); // Difference Two Times
          var hours = parseInt(duration.asHours()); // Calculate Hours
          hours = hours * 60; // Calculate Hours in min
          var minutes = (parseInt(duration.asMinutes()) % 60) + hours; // Calculate Min + Hours

          // If minutes greater than 0 lateby=minutes
          let lateby;
          if (minutes > 0) {
            lateby = minutes;
          } else {
            lateby = '';
          }

          let penalty;
          let penaltydeduction;

          let departments = await employeeDepartment(
            req.body.userMasterID,
            req.body.date
          );
          let department = departments;
          let assigndepartment;
          if (department) {
            assigndepartment = department.departmentID;
          } else {
            assigndepartment = null;
          }
          //Designation

          let designation = await employeeDesignation(
            req.body.userMasterID,
            req.body.date
          );

          let assigndesignation;
          if (designation) {
            assigndesignation = designation.designationID;
          } else {
            assigndesignation = null;
          }

          if (branch) {
            branch = branch.branchID;
          } else {
            branch = null;
          }
          // Insert In attendanceTransaction

          let insert_db_status = await attendanceTransaction.create({
            userMasterID: req.body.userMasterID,
            departmentID: assigndepartment,
            designationID: assigndesignation,
            branchID: branch,
            InDatetime: new Date(req.body.date),
            AttendanceDate: new Date(req.body.date1).toISOString().slice(0, 10),
            Shift: shift.shiftID,
            Shifthrs: get_options.totalhours,
            ShiftIntime: get_options.statTime,
            ShiftoutTime: get_options.endtime,
            LateBy: lateby,
            Panalty: penalty,
            PanaltyDeduction: penaltydeduction,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        } else {
          let day = new Date(req.body.date).toLocaleString('en-us', {
            weekday: 'long',
          });
          let company = await UserMaster.findOne({
            where: {
              userMasterID: req.body.userMasterID,
            },
          });

          //department
          let departments = await employeeDepartment(
            req.body.userMasterID,
            req.body.date
          );
          let department = departments;
          let assigndepartment;
          if (department) {
            assigndepartment = department.departmentID;
          } else {
            assigndepartment = null;
          }

          //Designation
          let designation = await employeeDesignation(
            req.body.userMasterID,
            req.body.date
          );

          let assigndesignation;
          if (designation) {
            assigndesignation = designation.designationID;
          } else {
            assigndesignation = null;
          }

          //Branch
          if (branch) {
            branch = branch.branchID;
          } else {
            branch = null;
          }

          let get_options = [];
          if (branch && assigndepartment && assigndesignation) {
            get_options = await shiftTime.findAll({
              where: {
                day: day,
                '$shift.companyMasterID$': company.companyMasterId,
                '$shift.status$': 1,
                '$shift.branchID$': branch,
                [Sequelize.Op.or]: [
                  {
                    [Sequelize.Op.and]: [
                      { '$shift.table$': 'designations' },
                      { '$shift.referenceId$': assigndesignation },
                    ],
                  },
                  {
                    [Sequelize.Op.and]: [
                      { '$shift.table$': 'departments' },
                      { '$shift.referenceId$': assigndepartment },
                    ],
                  },
                ],
              },
              include: [
                {
                  model: shiftModel,
                  as: 'shift',
                },
              ],
            });
          } else if (branch && assigndepartment) {
            get_options = await shiftTime.findAll({
              where: {
                day: day,
                '$shift.companyMasterID$': company.companyMasterId,
                '$shift.status$': 1,
                '$shift.branchID$': branch,
                '$shift.table$': 'departments',
                '$shift.referenceId$': assigndepartment,
              },
              include: [
                {
                  model: shiftModel,
                  as: 'shift',
                },
              ],
            });
          } else if (branch && assigndesignation) {
            get_options = await shiftTime.findAll({
              where: {
                day: day,
                '$shift.companyMasterID$': company.companyMasterId,
                '$shift.status$': 1,
                '$shift.branchID$': branch,
                '$shift.table$': 'designations',
                '$shift.referenceId$': assigndesignation,
              },
              include: [
                {
                  model: shiftModel,
                  as: 'shift',
                },
              ],
            });
          }

          if (get_options.length == 0) {
            get_options = await shiftTime.findAll({
              where: {
                day: day,
                '$shift.companyMasterID$': company.companyMasterId,
                '$shift.status$': 1,
                '$shift.branchID$': {
                  [Sequelize.Op.eq]: null,
                },

                [Sequelize.Op.or]: [
                  {
                    '$shift.table$': {
                      [Sequelize.Op.eq]: null,
                    },
                  },
                  {
                    '$shift.table$': '',
                  },
                ],

                [Sequelize.Op.or]: [
                  {
                    '$shift.referenceId$': {
                      [Sequelize.Op.eq]: null,
                    },
                  },
                  {
                    '$shift.referenceId$': 0,
                  },
                ],
              },
              include: [
                {
                  model: shiftModel,
                  as: 'shift',
                },
              ],
            });
          }

          if (get_options.length > 0) {
            for (var i = 0; i < get_options.length; i++) {
              let date = formatAMPM(new Date(req.body.date));
              var startTime = moment(date, 'HH:mm a');
              var endTime = moment(get_options[i].statTime, 'HH:mm: a');
              var duration = moment.duration(startTime.diff(endTime));
              var hours = parseInt(duration.asHours());
              hours = hours * 60;
              var minutes = Math.abs(
                (parseInt(duration.asMinutes()) % 60) + hours
              );
              get_options[i].dataValues.min = minutes;
            }
            get_options.sort(function (a, b) {
              return a.dataValues.min - b.dataValues.min;
            });

            let date = formatAMPM(new Date(req.body.date));
            var startTime = moment(date, 'HH:mm a');
            var endTime = moment(get_options[0].statTime, 'HH:mm: a');
            var duration = moment.duration(startTime.diff(endTime));
            var hours = parseInt(duration.asHours());
            hours = hours * 60;
            var minutes = (parseInt(duration.asMinutes()) % 60) + hours;
            let lateby;
            if (minutes > 0) {
              lateby = minutes;
            } else {
              lateby = '';
            }

            let penalty;
            let penaltydeduction;

            let insert_db_status = await attendanceTransaction.create({
              userMasterID: req.body.userMasterID,
              InDatetime: new Date(req.body.date),
              departmentID: assigndepartment,
              designationID: assigndesignation,
              branchID: branch,
              AttendanceDate: new Date(req.body.date1)
                .toISOString()
                .slice(0, 10),
              Shift: get_options[0].shift.shiftID,
              Shifthrs: get_options[0].totalhours,
              ShiftIntime: get_options[0].statTime,
              ShiftoutTime: get_options[0].endtime,
              Panalty: penalty,
              PanaltyDeduction: penaltydeduction,
              LateBy: lateby,
              createBy: req.body.createBy,
              createByIp: req.body.createByIp,
            });
          } else {
            return 404;
          }
        }
      }
    } else {
    }

    let get_one_data = await attendanceTransaction.findOne({
      where: {
        userMasterID: req.body.userMasterID,
        AttendanceDate: new Date(req.body.date1).toISOString().slice(0, 10),
      },
      order: [['createdAt', 'DESC']],
    });

    return get_one_data;
  } else {
    let get_one_data = await attendanceTransaction.findOne({
      where: {
        userMasterID: req.body.userMasterID,
      },
      order: [['createdAt', 'DESC']],
    });
    if (!get_one_data) {
    }
    let get_one_data1 = await attendanceTransaction.findOne({
      where: {
        AttendanceTransID: get_one_data.AttendanceTransID,
      },
      order: [['createdAt', 'DESC']],
    });

    const dateOne = get_one_data1.InDatetime;
    const dateTwo = req.body.date;
    const dateOneObj = new Date(dateOne);
    const dateTwoObj = new Date(dateTwo);
    const milliseconds = Math.abs(dateTwoObj - dateOneObj);
    const hours = milliseconds / 36e5;

    let minutes = hours * 60;

    let totaltime = Number(minutes);

    let day = new Date(req.body.date).toLocaleString('en-us', {
      weekday: 'long',
    });
    let get_options = await shiftTime.findOne({
      where: {
        shiftID: get_one_data.Shift,
        day: day,
      },
      include: [
        {
          model: shiftModel,
          as: 'shift',
        },
      ],
    });

    let shift_min = Number(get_one_data1.Shifthrs * 60);
    let earlyBy;
    const EarlybyMinutes = await calculateEarlyby(
      get_one_data.AttendanceDate,
      get_one_data.ShiftIntime,
      get_one_data.ShiftoutTime,
      new Date(req.body.date)
    );

    if (EarlybyMinutes) {
      earlyBy = EarlybyMinutes;
    } else {
      earlyBy = '';
    }

    let transactiondata = await attendanceTransaction.findOne({
      where: { AttendanceTransID: get_one_data.AttendanceTransID },
    });

    let dayname = new Date(transactiondata.AttendanceDate).toLocaleString(
      'en-us',
      {
        weekday: 'long',
      }
    );

    let shiftid = Number(transactiondata.Shift);

    let shift_Grace = Number(get_options.shift.shiftGrace) + totaltime;

    let fulldayhalfday = await executeQuery(
      'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
        shiftid +
        ',' +
        "'" +
        dayname +
        "'" +
        ',' +
        shift_Grace +
        ')'
    );

    let change_data = await attendanceTransaction.update(
      {
        OutDateTime: new Date(req.body.date),
        InHrs: Math.floor(totaltime),
        EarlyBy: earlyBy,
        //Panalty: penalty,
        //PanaltyDeduction: penaltydeduction,
        fulldayhalfday: Number(fulldayhalfday[0].fulldayhalfday),
      },
      {
        where: { AttendanceTransID: get_one_data.AttendanceTransID },
      }
    );

    await lateEarlyPenaltyManual(transactiondata);

    // await earlyby_deductionManual(transactiondata);

    // await penalty_deductionManual(transactiondata);

    if (get_one_data) {
      //Check if punchIN Date is Holiday or not
      let isHoliday = await checkHoliday(
        get_one_data.userMasterID,
        get_one_data.AttendanceDate
      );
      if (isHoliday == 1) {
        let get_Attendance_Policy = await employeeAttendancePolicy(
          req.body.userMasterID,
          get_one_data.AttendanceDate
        );

        //Getting latest Active Attendance Policy
        let attendance;
        if (get_Attendance_Policy) {
          attendance = get_Attendance_Policy;
        } else {
          attendance = null;
        }

        if (attendance != null) {
          //If Coff
          if (attendance.coff != null && attendance.coff != '') {
            //If Overtime
            if (attendance.coff == 'Overtime') {
              await coffOvertime(
                req.body.userMasterID,
                get_one_data.AttendanceTransID,
                totaltime
              );
            } else if (attendance.coff == 'AddLeave') {
              //If coff=>AddLeave
              if (attendance.coffhalfday && attendance.cofffullday) {
                let total_In_Hrs = totaltime / 60;

                if (
                  total_In_Hrs >= Number(attendance.coffhalfday) &&
                  total_In_Hrs < Number(attendance.cofffullday)
                ) {
                  //0.5
                  let company = await UserMaster.findOne({
                    where: {
                      userMasterID: get_one_data.userMasterID,
                    },
                  });

                  let companyMasterID = company.companyMasterID;

                  let temp = await addCoff(
                    get_one_data.userMasterID,
                    get_one_data.AttendanceDate,
                    0.5,
                    req.body.createBy,
                    req.body.createByIp
                  );
                } else if (total_In_Hrs >= Number(attendance.cofffullday)) {
                  //1
                  let company = await UserMaster.findOne({
                    where: {
                      userMasterID: get_one_data.userMasterID,
                    },
                  });

                  let companyID = company.companyMasterID;

                  await addCoff(
                    get_one_data.userMasterID,
                    get_one_data.AttendanceDate,
                    1,
                    req.body.createBy,
                    req.body.createByIp
                  );

                  //overtime
                  // await overtime(req.body.userMasterID, get_one_data.AttendanceTransID)
                } else {
                  // destroy coff here...

                  let temp = await coffMaster.destroy({
                    where: {
                      userMasterID: get_one_data.userMasterID,
                      LeaveCreatedDate: get_one_data.AttendanceDate,
                    },
                  });
                }
              } else {
                // await overtime(req.body.userMasterID, get_one_data.AttendanceTransID)
              }
            } else {
              // await overtime(req.body.userMasterID, get_one_data.AttendanceTransID)
            }
          } else {
            // await overtime(req.body.userMasterID, get_one_data.AttendanceTransID)
          }
        } else {
          // await overtime(req.body.userMasterID, get_one_data.AttendanceTransID)
        }
      } else {
        await overtime(req.body.userMasterID, get_one_data.AttendanceTransID);
      }
    } else {
      // await overtime(req.body.userMasterID, get_one_data.AttendanceTransID)
    }

    let transactiondata1 = await attendanceTransaction.findOne({
      where: { AttendanceTransID: get_one_data.AttendanceTransID },
    });
    return transactiondata1;
  }
}

async function deletedata(userMasterID, date) {
  let overtimedata = await overTimeCalculation.findOne({
    where: {
      UserMasterID: userMasterID,
      OverTimeDate: date,
    },
  });

  let attendancedata = await attendanceTransaction.findOne({
    where: {
      userMasterID: userMasterID,
      AttendanceDate: date,
    },
  });

  if (overtimedata) {
    let delete_data3 = await OvertimeAuthorizationRequest.destroy({
      where: {
        ReferenceID: overtimedata.OverTimeID,
      },
    });

    let delete_data1 = await overTimeCalculation.destroy({
      where: {
        UserMasterID: userMasterID,
        OverTimeDate: date,
      },
    });
  }

  let delete_data2 = await coffMaster.destroy({
    where: {
      userMasterID: userMasterID,
      LeaveCreatedDate: date,
    },
  });

  if (attendancedata) {
    let delete_logs = await AttendanceLogs.destroy({
      where: {
        AttendanceTransID: attendancedata.AttendanceTransID,
      },
    });

    let delete_data = await attendanceTransaction.destroy({
      where: {
        userMasterID: userMasterID,
        AttendanceDate: date,
      },
    });
  }
}

exports.uploadboimetricexcel = async (req, res, next) => {
  try {
    function replaceKeys(object) {
      Object.keys(object).forEach(function (key) {
        var newKey = key.replace(/(\r\n|\n|\r)/gm, '').trim();
        if (object[key] && typeof object[key] === 'object') {
          replaceKeys(object[key]);
        }
        if (key !== newKey) {
          object[newKey] = object[key];
          delete object[key];
        }
      });
    }

    const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

    const xlsxFile = require('read-excel-file/node');

    const workbook = xlsx.readFile(filePath);
    const sheet_name_list = workbook.SheetNames;
    var data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    let month = req.body.month;
    let createby = req.body.createBy;
    let createbyip = req.body.createByIp;
    let company = req.body.companyMasterID;

    let year = month.slice(0, 4);
    let Month = month.slice(5, 7);
    let monday = daysInMonth(Month, year);

    let yearmonth = year.concat(Month);

    let enddate = year + '-' + Month + '-' + monday;

    let startdate = year + '-' + Month + '-' + '01';

    let get_options = await shiftModel.findAll({
      where: {
        status: 1,
        companyMasterID: company,
      },
    });

    if (get_options.length > 0) {
      let userName = [];

      let empName = [];

      // data.forEach(async (el) => {

      for (const el of data) {
        var keys = Object.keys(el);

        // replace all keys

        replaceKeys(el);

        // find joining details

        let find_joining = await executeQuery(
          `
                
                SELECT * from "employeeJoiningDetails" as ej left outer join "userMasters" as um on ej."userMasterID" = um."userMasterID" where "companyMasterId"=` +
            company +
            ` and ej."biometricCode"='` +
            el['Biomatric Code'] +
            `'

                `
        );

        if (find_joining.length > 0) {
          let userMasterID = find_joining[0].userMasterID;

          for (var i = 0; i < keys.length; i++) {
            keys[i] = keys[i].replace(/(\r\n|\n|\r)/gm, '').trim();

            if (keys[i] != 'Biomatric Code' && keys[i] != 'Emp Name') {
              let temp_date = Number(keys[i]) < 10 ? '0' + keys[i] : keys[i];

              let date = month + '-' + temp_date;

              let deleteAlldata = await deletedata(userMasterID, date);

              if (
                el[keys[i]] != 'A' &&
                el[keys[i]] != 'WO-I' &&
                el[keys[i]] != '' &&
                el[keys[i]] != 'NA'
              ) {
                let punchintime = el[keys[i]].slice(0, 5)
                  ? date + ' ' + el[keys[i]].slice(0, 5) + ':' + '00'
                  : null;

                let punchouttime = el[keys[i]].slice(6, 11)
                  ? date + ' ' + el[keys[i]].slice(6, 11) + ':' + '00'
                  : null;

                if (punchintime != null && punchouttime != null) {
                  if (new Date(punchintime) > new Date(punchouttime)) {
                    var date1 = new Date(date);

                    date1.setDate(date1.getDate() + 1);

                    let punchout_date =
                      date1.getFullYear() +
                      '-' +
                      String(date1.getMonth() + 1).padStart(2, '0') +
                      '-' +
                      String(date1.getDate()).padStart(2, '0');

                    punchouttime =
                      punchout_date +
                      ' ' +
                      el[keys[i]].slice(6, 11) +
                      ':' +
                      '00';
                  }
                }

                let body = {
                  userMasterID: userMasterID,
                  direction: 'in',
                  newpunchin: true,
                  photo: 'url',
                  attendnaceFrom: 'excel',
                  date: punchintime,
                  date1: date,
                  createBy: createby,
                  createByIp: createbyip,
                  address: 'MST',
                };

                let req = {
                  body: body,
                };

                let final = await uploadexcelpunchinpunchout(req);

                if (final == 404) {
                  let username = userName.filter((e) => {
                    return (e = el['Emp Name']);
                  });

                  if (username.length > 0) {
                  } else {
                    userName.push(el['Emp Name']);
                  }
                } else {
                  if (punchouttime != null) {
                    req.body.direction = 'out';
                    req.body.date = punchouttime;

                    final = await uploadexcelpunchinpunchout(req);
                  }

                  let find_attendance = await attendanceTransaction.findOne({
                    where: {
                      AttendanceTransID: final.AttendanceTransID,
                    },
                  });

                  await createlogs(find_attendance, 'excel');
                }
              }
            }
          }
        } else {
          empName.push(el['Emp Name']);
        }
      }

      fs.unlink(filePath, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('delete');
        }
      });

      if (empName.length > 0) {
        res.status(200).json({
          status: 401,
          message:
            'Please add joining details of' +
            ' ' +
            empName.join() +
            ' ' +
            'and others Attendance Upload successfully',
        });
      } else {
        if (userName.length > 0) {
          res.status(200).json({
            status: 401,
            message:
              'Please assign shift to' +
              ' ' +
              userName.join() +
              ' ' +
              'and others Attendance Upload successfully',
          });
        } else {
          res.status(200).json({
            status: 200,
            message: 'Attendance Upload Successfully',
          });
        }
      }
    } else {
      res.status(200).json({
        status: 401,
        message: 'Please create atleast one shift ',
      });
    }
  } catch (err) {
    next(err);
  }
};
