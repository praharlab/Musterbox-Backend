const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const Designation = require('../models/designation');
const Sequelize = require('sequelize');
const attendanceTransaction = require('../models/attendanceTransaction');
const UserMaster = require('../models/userMaster');
const EmployeeShift = require('../models/employeeShift');
const EmployeeBranch = require('../models/employeeBranch');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const shiftTime = require('../models/shiftTime');
const shiftModel = require('../models/shift');
const AttendanceLogs = require('../models/attendancelogs');
const moment = require('moment');
const userMaster = require('../models/userMaster');
const { executeQuery } = require('./common.controller');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeAttendance = require('../models/employeeAttendancePolicy');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const OvertimeAuthorizationRequest = require('../models/overtimeAuthorization');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const overTimeCalculation = require('../models/overTimeCalculation');
const companyMaster = require('../models/companyMaster');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const hrLeaveTypes = require('../models/hrLeaveTypes');
const hrLeaveBalances = require('../models/hrLeaveBalance');
const UserLeaves = require('../models/userleave');
const coffMaster = require('../models/coffMaster');
const datewiseAttendancepolicy = require('../models/datewiseAttendancepolicy');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const UserLeaveTransaction = require('../models/userLeaveTransaction');
const UserLeave = require('../models/userleave');
const AttendancePolicy = require('../models/attendancePolicy');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const CompensatoryOffAuthorization = require('../models/compensatoryOffAuthorization');
const AttendanceCorrection = require('../models/attendanceCorrection');
const {
  daysInMonth,
  formatAMPM,
  checkHoliday,
  overtime,
  employeeAttendancePolicy,
  employeeDepartment,
  employeeShift,
  employeeDesignation,
  employeeBranch,
  addCoff,
  coffOvertime,

  lateComingPenalty,
  earlyByPermission,
  monthStartDateBetween,
  employeeSalaryPolicy,
  getAutomticShiftAssigned,
  calculateEarlyby,
  calculateLateby,
  getemployeeJoiningDetails,
  getDatesFromDateRange,
  toHoursAndMinutes,
  getAllUserByCompanyDateWise,
  getAllUserByBranchDateWise,
  calculateDateTimeDifference,
  getFinancialYearDatesFromDate,
  month_dict,
  getUserByCompanyandDateRange,
  getBranchByLatLong,
  employeeWorkingLocation,
  // employeeWorkingLocation,
  CountCurrentPenalties,
  countFinalPenalties,
  countPenalties,
  countMonthLateByPenalties,
  getTotalMinutes,
  countEarlyPenalties,
  countMonthEarlyByPenalties,
  getCurrentEarlyByPenalty,
  employeeLateEarlyPolicy,
  userDetails,
  addAsopalavBreakTimePenalty,
  addAsopalavBreakTime,
  getLeave,
  paginate,
  getUserByDepartmentandDate,
  getUserSalaryMasterByMonth,
  getDDMMYYYYdate,
  getTimeHHMMSSFormat,
  asiaKolkataDateTime,
  combined_deductionMobile,
  combined_deductionManual,
  penalty_deductionManual,
  earlyby_deductionManual,
  addFoodAllowanceInAttendance,
  getAutomticShiftAssignedMobile,
  addCoffMobile,
  coffOvertimeMobile,
  overtimeMobile,
  getShiftData,
  calculateDays,
  getAllDatesBetween,
  toGetFinalHolidayWeekoff,
  addExtraDaysMobile,
  findWeekoff_Without_trans,
  add_normalDay_CoffMobile,
  add_normalDay_ExtraDayMobile,
  deleteOvertimeCoffExtraDaysMobile,
} = require('../utils/commonUtilFunctions');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const Shift = require('../models/shift');
const notificationPolicy = require('../models/notificationPolicy');
const {
  generateExcel,
  generateChecklistExcel,
  generateExcelForLeave,
  generateAttendanceExcel,
  generateExcelForDailyCost,
  generateExcelForPunchInPunchOutReport,
} = require('../utils/exportData');
const FormMaster = require('../models/formMaster');
const { Op } = require('sequelize');
const ShiftTIme = require('../models/shiftTime');
const { isArray } = require('lodash');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const RolePermission = require('../models/rolePermission');
const RoleMaster = require('../models/roleMaster');
const EmployeeLateEarlyPolicy = require('../models/employeeLateEarlyPolicy');
const LateEarlyPolicy = require('../models/lateEarlyPolicy');
const { join } = require('path');
const { attendancePhotobase64Topng } = require('../utils/base64Topng');
const AutoMailSetup = require('../models/autoMailSetup');
const RoleMasterBranchWise = require('../models/roleMasterBranchWise');
const UserInbox = require('../models/UserInbox');
const ShiftRoster = require('../models/shiftRoster');
const UserShortLeave = require('../models/userShortLeave');
const EmployeeShortLeavePolicy = require('../models/employeeShortLeavePolicy');
const ShortLeave = require('../models/shortLeave');
const {
  roleType,
  attendaceTransType,
  attendanceTransactionType,
  authorizationMasterTypes,
  attendanceBranchTypeRule,
} = require('../utils/dbUtils');
const ExtraDays = require('../models/extraDays');
const ExtraDaysAuthorization = require('../models/extraDaysAuthorization');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const EmployeeProject = require('../models/employeeProject');
const Project = require('../models/project');

function roundToNearestHour(minutes, roundoff) {
  // Calculate hours and the remaining minutes
  let hours = Math.floor(minutes / 60);
  let remainingMinutes = minutes % 60;

  // Round up if remaining minutes are more
  if (+remainingMinutes > +roundoff) {
    hours += 1;
  }

  return hours;
}
// Attendance API
exports.attendanceApi = async (req, res, next) => {
  try {
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const user_details = await userMaster.findOne({
      where: {
        userMasterID: req.body.userMasterID,
        status: 1,
      },
      include: [
        {
          required: false,
          separate: true,
          model: EmployeeAttendancePolicy,
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
          attributes: ['attendancePolicyID'],
          include: [
            {
              model: AttendancePolicy,
              as: 'attendancePolicy',
            },
          ],
        },
        {
          separate: true,
          required: false,
          model: EmployeeBranch,
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
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['branchID'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
            },
          ],
        },
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
          // separate: true,
          // attributes: ['designationID'],
          // include: [
          //   {
          //     model: Designation,
          //     as: 'designation',

          //   },
          // ],
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
        },

        {
          model: EmployeeLateEarlyPolicy,
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
          attributes: ['lateEarlyPolicyMasterID'],
          include: [
            {
              model: LateEarlyPolicy,
              as: 'lateEarlyPolicy',
            },
          ],
        },
        {
          model: EmployeeJoiningDetails,
          required: false,
        },
        {
          required: false,
          separate: true,
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
          required: false,
          model: ShiftRoster,
          where: {
            status: 1,
            shiftRosterDate: date,
          },
        },
        {
          required: false,
          model: EmployeeShift,
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
        },
      ],
    });

    if (!user_details) {
      return res.status(200).json({
        status: 401,
        message: 'User details not found',
        data: {},
      });
    }

    const attendancePolicy =
      user_details.employeeAttendancePolicies &&
      user_details.employeeAttendancePolicies.length > 0
        ? user_details.employeeAttendancePolicies[0].attendancePolicy
          ? user_details.employeeAttendancePolicies[0].attendancePolicy
              .dataValues
          : null
        : null;
    const branch =
      user_details.employeeBranches && user_details.employeeBranches.length > 0
        ? user_details.employeeBranches[0].branchMaster
          ? user_details.employeeBranches[0].branchMaster.dataValues
          : null
        : null;

    if (req.body.attendnaceFrom == 'web') {
      await attendancepunchinpunchout(
        user_details.companyMasterId,
        user_details
      );
    } else {
      if (attendancePolicy != null) {
        if (attendancePolicy.outsidePunchInPunchOut == 1) {
          await attendancepunchinpunchout(
            user_details.companyMasterId,
            user_details
          );
        } else {
          let get_permission = await datewiseAttendancepolicy.findOne({
            where: {
              userMasterID: req.body.userMasterID,
              fromDate: {
                [Sequelize.Op.lte]: new Date(date),
              },
              ToDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
          });

          if (get_permission) {
            await attendancepunchinpunchout(
              user_details.companyMasterId,
              user_details
            );
          } else {
            const getLocationMatch = await getBranchByLatLong(
              user_details.companyMasterId,
              req.body.latitude,
              req.body.longitude,
              req.body.userMasterID,
              attendancePolicy,
              branch
            );
            if (getLocationMatch.id) {
              await attendancepunchinpunchout(
                user_details.companyMasterId,
                user_details
              );
            } else {
              if (
                attendancePolicy.attBrType ==
                  attendanceBranchTypeRule.ASSIGNED &&
                !branch
              ) {
                return res.status(200).json({
                  status: 401,
                  message: 'Branch not assigned',
                  data: {},
                });
              } else {
                return res.status(200).json({
                  status: 401,
                  message: message.usermessage.radiusnotmatch,
                  data: {},
                });
              }
            }
          }
        }
      } else {
        await attendancepunchinpunchout(
          user_details.companyMasterId,
          user_details
        );
      }
    }

    async function attendancepunchinpunchout(companyMasterId, user_details) {
      const today = asiaKolkataDateTime(new Date()).slice(0, 10);
      const attendancePolicy =
        user_details.employeeAttendancePolicies &&
        user_details.employeeAttendancePolicies.length > 0
          ? user_details.employeeAttendancePolicies[0].attendancePolicy
            ? user_details.employeeAttendancePolicies[0].attendancePolicy
                .dataValues
            : null
          : null;
      let live_branch = null,
        LocationType = null;
      const branch =
        user_details.employeeBranches &&
        user_details.employeeBranches.length > 0
          ? user_details.employeeBranches[0].branchMaster
            ? user_details.employeeBranches[0].branchMaster.dataValues
            : null
          : null;

      if (req.body.attendnaceFrom == 'web') {
        live_branch = branch ? branch.branchMasterID : null;
        LocationType = 'branch';
        if (branch) {
          req.body.latitude = branch.latitude ? branch.latitude : 'web';
          req.body.longitude = branch.longitude ? branch.longitude : 'web';
          req.body.address = branch.branchAddress ? branch.branchAddress : ' ';
        } else {
          req.body.latitude = 'web';
          req.body.longitude = 'web';
          req.body.address = 'web';
        }
      } else {
        let getLocationType = await getBranchByLatLong(
          companyMasterId,
          req.body.latitude,
          req.body.longitude,
          req.body.userMasterID,
          attendancePolicy,
          branch
        );
        live_branch = getLocationType.id;
        LocationType = getLocationType.locationType;
      }

      const salaryPolicy =
        user_details.employeeSalaryPolicies &&
        user_details.employeeSalaryPolicies.length > 0
          ? user_details.employeeSalaryPolicies[0].salaryPolicy
            ? user_details.employeeSalaryPolicies[0].salaryPolicy
            : null
          : null;

      const employeeShiftRoster = user_details.shiftRosters?.[0] || null;
      const employeeShift = user_details.employeeShifts?.[0] || null;

      if (req.body.direction == 'in') {
        if (req.body.newpunchin == true) {
          let new_punchIN = await attendanceTransaction.findOne({
            where: {
              userMasterID: req.body.userMasterID,
              Status: 1,
              AttendanceDate: today,
            },
          });

          //If already punch IN for same day
          if (new_punchIN) {
            return res.json({
              status: 401,
              message: 'You have already punch IN and Punch OUT for today',
              data: {},
            });
          }

          let get_one_data = await getShiftData(
            employeeShift,
            employeeShiftRoster,
            date
          );
          // Find Active Data
          let shift;
          if (get_one_data) {
            shift = get_one_data;
          }

          const designation =
            user_details.employeeDesignations &&
            user_details.employeeDesignations.length > 0
              ? user_details.employeeDesignations[0]
              : null;

          const department =
            user_details.employeeDepartments &&
            user_details.employeeDepartments.length > 0
              ? user_details.employeeDepartments[0]
              : null;

          let insert_db_status;

          if (attendancePolicy) {
            if (attendancePolicy.automaticAssignShift == 0) {
              if (shift) {
                let day = new Date().toLocaleString('en-us', {
                  weekday: 'long',
                });
                let get_options = await shiftTime.findOne({
                  where: {
                    shiftID: shift.shiftID,
                    day: day,
                  },
                }); // Find shift time options

                let lateby;
                const lateMinutes = await calculateLateby(
                  today,
                  get_options.statTime,
                  new Date()
                );
                if (lateMinutes) {
                  lateby = lateMinutes;
                } else {
                  lateby = '';
                }

                let penalty;
                let penaltydeduction;

                const assigndepartment = department
                  ? department.departmentID
                  : null;
                const assigndesignation = designation
                  ? designation.designationID
                  : null;
                const assignbranch = branch ? branch.branchMasterID : null;

                if (req.body.photo) {
                  const [year, month] = today.split('-');
                  let dataUrl = 'data:image/png;base64,' + req.body.photo;
                  let fileName = `attendaceLogs_${
                    req.body.userMasterID
                  }_${Date.now()}.png`;
                  let filePath = `uploads/attendaceLogs/${user_details.companyMasterId}/${month}${year}/`;
                  req.body.photo = filePath + fileName;
                  attendancePhotobase64Topng(dataUrl, fileName, filePath);
                }

                insert_db_status = await attendanceTransaction.create({
                  userMasterID: req.body.userMasterID,
                  departmentID: assigndepartment,
                  designationID: assigndesignation,
                  branchID: assignbranch,
                  InDatetime: new Date(),
                  AttendanceDate: today,
                  Shift: shift.shiftID,
                  Shifthrs: get_options.totalhours,
                  ShiftIntime: get_options.statTime,
                  ShiftoutTime: get_options.endtime,
                  LateBy: lateby,
                  Panalty: penalty,
                  PanaltyDeduction: penaltydeduction,
                  punchINbranch: live_branch,
                  locationTypeIN: LocationType,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });
                // Insert In AttendanceLogs

                insert_db = await AttendanceLogs.create({
                  userMasterID: req.body.userMasterID,
                  AttendanceTransID:
                    insert_db_status.dataValues.AttendanceTransID,
                  logDateTime: new Date(),
                  direction: req.body.direction,
                  photo: req.body.photo,
                  attendnaceFrom: req.body.attendnaceFrom,
                  longitude: req.body.longitude,
                  latitude: req.body.latitude,
                  address: req.body.address,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });
              } else {
                return res.json({
                  status: 401,
                  message: message.usermessage.assignshift,
                  data: {},
                });
              }
            } else {
              //  Check shift
              if (shift) {
                let day = new Date().toLocaleString('en-us', {
                  weekday: 'long',
                });
                let get_options = await shiftTime.findOne({
                  where: {
                    shiftID: shift.shiftID,
                    day: day,
                  },
                }); // Find shift time options

                let lateby;
                const lateMinutes = await calculateLateby(
                  today,
                  get_options.statTime,
                  new Date()
                );
                if (lateMinutes) {
                  lateby = lateMinutes;
                } else {
                  lateby = '';
                }

                let penalty;
                let penaltydeduction;

                const assigndepartment = department
                  ? department.departmentID
                  : null;
                const assigndesignation = designation
                  ? designation.designationID
                  : null;
                const assignbranch = branch ? branch.branchMasterID : null;

                if (req.body.photo) {
                  const [year, month] = today.split('-');
                  let dataUrl = 'data:image/png;base64,' + req.body.photo;
                  let fileName = `attendaceLogs_${
                    req.body.userMasterID
                  }_${Date.now()}.png`;
                  let filePath = `uploads/attendaceLogs/${user_details.companyMasterId}/${month}${year}/`;
                  req.body.photo = filePath + fileName;
                  attendancePhotobase64Topng(dataUrl, fileName, filePath);
                }

                insert_db_status = await attendanceTransaction.create({
                  userMasterID: req.body.userMasterID,
                  departmentID: assigndepartment,
                  designationID: assigndesignation,
                  branchID: assignbranch,
                  InDatetime: new Date(),
                  AttendanceDate: today,
                  Shift: shift.shiftID,
                  Shifthrs: get_options.totalhours,
                  ShiftIntime: get_options.statTime,
                  ShiftoutTime: get_options.endtime,
                  LateBy: lateby,
                  Panalty: penalty,
                  PanaltyDeduction: penaltydeduction,
                  punchINbranch: live_branch,
                  locationTypeIN: LocationType,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });
                // Insert In AttendanceLogs

                insert_db = await AttendanceLogs.create({
                  userMasterID: req.body.userMasterID,
                  AttendanceTransID:
                    insert_db_status.dataValues.AttendanceTransID,
                  logDateTime: new Date(),
                  direction: req.body.direction,
                  photo: req.body.photo,
                  attendnaceFrom: req.body.attendnaceFrom,
                  longitude: req.body.longitude,
                  latitude: req.body.latitude,
                  address: req.body.address,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });
              } else {
                const getAutoShift = await getAutomticShiftAssignedMobile(
                  req.body.userMasterID,
                  new Date(),
                  user_details
                );

                if (getAutoShift) {
                  let lateby;
                  const lateMinutes = await calculateLateby(
                    today,
                    getAutoShift.statTime,
                    new Date()
                  );
                  if (lateMinutes) {
                    lateby = lateMinutes;
                  } else {
                    lateby = '';
                  }

                  const assigndepartment = department
                    ? department.departmentID
                    : null;
                  const assigndesignation = designation
                    ? designation.designationID
                    : null;
                  const assignbranch = branch ? branch.branchMasterID : null;

                  if (req.body.photo) {
                    const [year, month] = today.split('-');
                    let dataUrl = 'data:image/png;base64,' + req.body.photo;
                    let fileName = `attendaceLogs_${
                      req.body.userMasterID
                    }_${Date.now()}.png`;
                    let filePath = `uploads/attendaceLogs/${user_details.companyMasterId}/${month}${year}/`;
                    req.body.photo = filePath + fileName;
                    attendancePhotobase64Topng(dataUrl, fileName, filePath);
                  }

                  insert_db_status = await attendanceTransaction.create({
                    userMasterID: req.body.userMasterID,
                    InDatetime: new Date(),
                    departmentID: assigndepartment,
                    designationID: assigndesignation,
                    branchID: assignbranch,
                    AttendanceDate: today,
                    Shift: getAutoShift.shiftID,
                    Shifthrs: getAutoShift.totalhours,
                    ShiftIntime: getAutoShift.statTime,
                    ShiftoutTime: getAutoShift.endtime,
                    punchINbranch: live_branch,
                    locationTypeIN: LocationType,
                    LateBy: lateby,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  });

                  insert_db = await AttendanceLogs.create({
                    userMasterID: req.body.userMasterID,
                    AttendanceTransID:
                      insert_db_status.dataValues.AttendanceTransID,
                    logDateTime: new Date(),
                    direction: req.body.direction,
                    photo: req.body.photo,
                    attendnaceFrom: req.body.attendnaceFrom,
                    longitude: req.body.longitude,
                    latitude: req.body.latitude,
                    address: req.body.address,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  });
                } else {
                  return res.json({
                    status: 401,
                    message: message.usermessage.shiftadds,
                    data: {},
                  });
                }
              }
            }
          } else {
            //  Check shift
            if (shift) {
              let day = new Date().toLocaleString('en-us', { weekday: 'long' });
              let get_options = await shiftTime.findOne({
                where: {
                  shiftID: shift.shiftID,
                  day: day,
                },
              }); // Find shift time options

              let lateby;
              const lateMinutes = await calculateLateby(
                today,
                get_options.statTime,
                new Date()
              );
              if (lateMinutes) {
                lateby = lateMinutes;
              } else {
                lateby = '';
              }

              let penalty;
              let penaltydeduction;
              const assigndepartment = department
                ? department.departmentID
                : null;
              const assigndesignation = designation
                ? designation.designationID
                : null;
              const assignbranch = branch ? branch.branchMasterID : null;

              if (req.body.photo) {
                const [year, month] = today.split('-');
                let dataUrl = 'data:image/png;base64,' + req.body.photo;
                let fileName = `attendaceLogs_${
                  req.body.userMasterID
                }_${Date.now()}.png`;
                let filePath = `uploads/attendaceLogs/${user_details.companyMasterId}/${month}${year}/`;
                req.body.photo = filePath + fileName;
                attendancePhotobase64Topng(dataUrl, fileName, filePath);
              }

              insert_db_status = await attendanceTransaction.create({
                userMasterID: req.body.userMasterID,
                departmentID: assigndepartment,
                designationID: assigndesignation,
                branchID: assignbranch,
                InDatetime: new Date(),
                AttendanceDate: today,
                Shift: shift.shiftID,
                Shifthrs: get_options.totalhours,
                ShiftIntime: get_options.statTime,
                ShiftoutTime: get_options.endtime,
                LateBy: lateby,
                Panalty: penalty,
                PanaltyDeduction: penaltydeduction,
                punchINbranch: live_branch,
                locationTypeIN: LocationType,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              });
              // Insert In AttendanceLogs

              insert_db = await AttendanceLogs.create({
                userMasterID: req.body.userMasterID,
                AttendanceTransID:
                  insert_db_status.dataValues.AttendanceTransID,
                logDateTime: new Date(),
                direction: req.body.direction,
                photo: req.body.photo,
                attendnaceFrom: req.body.attendnaceFrom,
                longitude: req.body.longitude,
                latitude: req.body.latitude,
                address: req.body.address,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              });
            } else {
              const getAutoShift = await getAutomticShiftAssignedMobile(
                req.body.userMasterID,
                new Date(),
                user_details
              );

              if (getAutoShift) {
                let lateby;
                const lateMinutes = await calculateLateby(
                  today,
                  getAutoShift.statTime,
                  new Date()
                );
                if (lateMinutes) {
                  lateby = lateMinutes;
                } else {
                  lateby = '';
                }

                let penalty;
                let penaltydeduction;

                const assigndepartment = department
                  ? department.departmentID
                  : null;
                const assigndesignation = designation
                  ? designation.designationID
                  : null;
                const assignbranch = branch ? branch.branchMasterID : null;

                if (req.body.photo) {
                  const [year, month] = today.split('-');
                  let dataUrl = 'data:image/png;base64,' + req.body.photo;
                  let fileName = `attendaceLogs_${
                    req.body.userMasterID
                  }_${Date.now()}.png`;
                  let filePath = `uploads/attendaceLogs/${user_details.companyMasterId}/${month}${year}/`;
                  req.body.photo = filePath + fileName;
                  attendancePhotobase64Topng(dataUrl, fileName, filePath);
                }

                insert_db_status = await attendanceTransaction.create({
                  userMasterID: req.body.userMasterID,
                  InDatetime: new Date(),
                  departmentID: assigndepartment,
                  designationID: assigndesignation,
                  branchID: assignbranch,
                  AttendanceDate: today,
                  Shift: getAutoShift.shiftID,
                  Shifthrs: getAutoShift.totalhours,
                  ShiftIntime: getAutoShift.statTime,
                  ShiftoutTime: getAutoShift.endtime,
                  Panalty: penalty,
                  PanaltyDeduction: penaltydeduction,
                  punchINbranch: live_branch,
                  locationTypeIN: LocationType,
                  LateBy: lateby,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });

                insert_db = await AttendanceLogs.create({
                  userMasterID: req.body.userMasterID,
                  AttendanceTransID:
                    insert_db_status.dataValues.AttendanceTransID,
                  logDateTime: new Date(),
                  direction: req.body.direction,
                  photo: req.body.photo,
                  attendnaceFrom: req.body.attendnaceFrom,
                  longitude: req.body.longitude,
                  latitude: req.body.latitude,
                  address: req.body.address,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });
              } else {
                return res.json({
                  status: 401,
                  message: message.usermessage.shiftadds,
                  data: {},
                });
              }
            }
          }

          // if shift roster is not available

          if (!employeeShiftRoster && insert_db_status) {
            await ShiftRoster.create(
              {
                userMasterID: insert_db_status.userMasterID,
                shiftID: insert_db_status.Shift,
                shiftRosterDate: insert_db_status.AttendanceDate,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              },
              { hooks: false }
            );
          }

          return res.json({
            status: 200,
            message: message.usermessage.punchin,
          });
        } else {
          let get_one_data = await attendanceTransaction.findOne({
            where: {
              userMasterID: req.body.userMasterID,
            },
            order: [['AttendanceDate', 'DESC']],
          });

          //To destroy Old Coff for continue punch IN
          let get_coff = await coffMaster.findOne({
            where: {
              userMasterID: req.body.userMasterID,
              LeaveCreatedDate: today,
              status: 1,
            },
          });

          if (get_coff) {
            if (get_coff.LeaveBalTranId) {
              await hrLeaveBalances.destroy({
                where: {
                  LeaveBalTranId: get_coff.LeaveBalTranId,
                },
              });
              if (get_coff.authorizationStatus != 0) {
                await CompensatoryOffAuthorization.destroy({
                  where: {
                    coffMasterID: get_coff.coffMasterID,
                  },
                });
              }
              await coffMaster.destroy({
                where: {
                  userMasterID: req.body.userMasterID,
                  LeaveCreatedDate: today,
                  status: 1,
                },
              });
            } else {
              let destroy_coff = await coffMaster.destroy({
                where: {
                  userMasterID: req.body.userMasterID,
                  LeaveCreatedDate: today,
                  status: 1,
                },
              });
              if (get_coff.authorizationStatus != 0) {
                await CompensatoryOffAuthorization.destroy({
                  where: {
                    coffMasterID: get_coff.coffMasterID,
                  },
                });
              }
            }
          }

          const overtimedata = await overTimeCalculation.findOne({
            where: {
              UserMasterID: req.body.userMasterID,
              OverTimeDate: get_one_data.AttendanceDate,
            },
          });

          if (overtimedata) {
            await OvertimeAuthorizationRequest.destroy({
              where: { ReferenceID: overtimedata.OverTimeID },
            });

            await overTimeCalculation.destroy({
              where: {
                UserMasterID: req.body.userMasterID,
                OverTimeDate: get_one_data.AttendanceDate,
              },
            });
          }

          const extraDaysData = await ExtraDays.findOne({
            where: {
              userMasterID: req.body.userMasterID,
              date: get_one_data.AttendanceDate,
            },
          });

          if (extraDaysData) {
            if (extraDaysData.authorizationStatus != 0) {
              const extraDaysAuthData = await ExtraDaysAuthorization.findAll({
                where: {
                  extraDaysID: extraDaysData.extraDaysID,
                },
              });

              const allIds = extraDaysAuthData.map(
                (e) => e.extraDaysAuthorizationID
              );

              await UserInbox.destroy({
                where: {
                  activityTable: ExtraDaysAuthorization.getTableName(),
                  activityTablePK: allIds,
                },
              });

              await ExtraDaysAuthorization.destroy({
                where: {
                  extraDaysID: extraDaysData.extraDaysID,
                },
              });
            }

            await ExtraDays.destroy({
              where: {
                userMasterID: req.body.userMasterID,
                date: get_one_data.AttendanceDate,
              },
            });
          }

          let get_one_data1 = await AttendanceLogs.findOne({
            where: {
              AttendanceTransID: get_one_data.AttendanceTransID,
            },
            order: [['createdAt', 'DESC']],
          });
          if (get_one_data1.logDateTime != null) {
            let punchindate = formatAMPM(get_one_data1.logDateTime);
            let date = formatAMPM(new Date());
            var startTime = moment(date, 'HH:mm a');
            var endTime = moment(punchindate, 'HH:mm: a');
            var duration = moment.duration(startTime.diff(endTime));
            var hours = parseInt(duration.asHours());
            hours = hours * 60;
            var minutes = Math.abs(
              (parseInt(duration.asMinutes()) % 60) + hours
            );

            let totaltime = Number(get_one_data.OutHrs) + Number(minutes);

            const userdetail = await userDetails(req.body.userMasterID);
            if (
              userdetail.companyMasterId == 277 ||
              userdetail.companyMasterId == 300 ||
              userdetail.companyMasterId == 298
            ) {
              await attendanceTransaction.update(
                {
                  OutDateTime: null,
                  OutHrs: totaltime,
                  EarlyBy: null,
                  Panalty: null,
                  PanaltyDeduction: null,
                  goEarlyPanalty: null,
                  goEarlyPanaltyDeduction: null,
                  latePenaltyMinutes: null,
                  earlyPenaltyMinutes: null,
                  fulldayhalfday: null,
                  punchOUTbranch: null,
                  locationTypeOUT: null,
                  roundOffMinutes: null,
                },
                { where: { AttendanceTransID: get_one_data.AttendanceTransID } }
              );

              const penaltyID =
                userdetail.companyMasterId == 277
                  ? 90
                  : userdetail.companyMasterId == 298
                    ? 166
                    : 201;

              const breakTime = await addAsopalavBreakTime(
                get_one_data,
                new Date()
              );

              const totalBreakTime =
                new Date(get_one_data.AttendanceDate + ' 09:35 AM') >
                new Date(get_one_data.InDatetime)
                  ? 90
                  : 45;

              if (breakTime.type == 'teabreak') {
                if (
                  breakTime.diff + +get_one_data.lunchBreak >
                  totalBreakTime
                ) {
                  await addAsopalavBreakTimePenalty(
                    req.body.userMasterID,
                    get_one_data.AttendanceDate,
                    penaltyID
                  );
                }
                await attendanceTransaction.update(
                  {
                    teaBreak: breakTime.diff,
                    teaBreakInStartTime: breakTime.starttime,
                    teaBreakEndTime: breakTime.endtime,
                  },
                  {
                    where: {
                      AttendanceTransID: get_one_data.AttendanceTransID,
                    },
                  }
                );
              } else if (breakTime.type == 'lunchBreak') {
                if (breakTime.diff > totalBreakTime) {
                  await addAsopalavBreakTimePenalty(
                    req.body.userMasterID,
                    get_one_data.AttendanceDate,
                    penaltyID
                  );
                }
                await attendanceTransaction.update(
                  {
                    lunchBreak: breakTime.diff,
                    lunchBreakStartTime: breakTime.starttime,
                    lunchBreakEndTime: breakTime.endtime,
                  },
                  {
                    where: {
                      AttendanceTransID: get_one_data.AttendanceTransID,
                    },
                  }
                );
              }
            } else {
              let change_data = await attendanceTransaction.update(
                {
                  OutDateTime: null,
                  OutHrs: totaltime,
                  EarlyBy: '',
                  Panalty: '',
                  PanaltyDeduction: '',
                  goEarlyPanalty: null,
                  goEarlyPanaltyDeduction: null,
                  latePenaltyMinutes: null,
                  earlyPenaltyMinutes: null,
                  fulldayhalfday: null,
                  punchOUTbranch: null,
                  locationTypeOUT: null,
                  roundOffMinutes: null,
                },
                {
                  where: { AttendanceTransID: get_one_data.AttendanceTransID },
                }
              );
            }

            if (req.body.photo) {
              const [year, month] = today.split('-');
              let dataUrl = 'data:image/png;base64,' + req.body.photo;
              let fileName = `attendaceLogs_${
                req.body.userMasterID
              }_${Date.now()}.png`;
              let filePath = `uploads/attendaceLogs/${user_details.companyMasterId}/${month}${year}/`;
              req.body.photo = filePath + fileName;
              attendancePhotobase64Topng(dataUrl, fileName, filePath);
            }

            insert_db = await AttendanceLogs.create({
              userMasterID: req.body.userMasterID,
              AttendanceTransID: get_one_data.AttendanceTransID,
              logDateTime: new Date(),
              direction: req.body.direction,
              photo: req.body.photo,
              attendnaceFrom: req.body.attendnaceFrom,
              longitude: req.body.longitude,
              latitude: req.body.latitude,
              address: req.body.address,
              createBy: req.body.createBy,
              createByIp: req.body.createByIp,
            });

            return res.json({
              status: 200,
              message: message.usermessage.punchin,
              data: get_one_data,
            });
          } else {
            return res.json({
              status: 401,
              message: message.usermessage.punchoutcond,
              data: {},
            });
          }
        }
      } else {
        let get_one_data = await attendanceTransaction.findOne({
          where: {
            userMasterID: req.body.userMasterID,
          },
          order: [['AttendanceDate', 'DESC']],
        });
        if (!get_one_data) {
          return res.json({
            status: 200,
            message: message.usermessage.punchoutcond,
            data: {},
          });
        }

        let get_one_data1 = await AttendanceLogs.findOne({
          where: {
            AttendanceTransID: get_one_data.AttendanceTransID,
          },
          order: [['createdAt', 'DESC']],
        });

        let dt1 = new Date(get_one_data1.logDateTime);
        let dt2 = new Date();

        diff = (dt2.getTime() - dt1.getTime()) / 1000;
        diff /= 60;
        diff = Math.abs(Math.round(diff));
        var minutes = diff;

        // let get_one_attendancepolicy = await employeeAttendancePolicy(
        //   req.body.userMasterID,
        //   new Date().toISOString().slice(0, 10)
        // );
        if (attendancePolicy && attendancePolicy.missPunchMinutes) {
          const time_Difference = await calculateDateTimeDifference(
            new Date(
              `${get_one_data.AttendanceDate} ${get_one_data.ShiftIntime}`
            ),
            new Date()
          );

          if (time_Difference > +attendancePolicy.missPunchMinutes) {
            return res.json({
              status: 401,
              message:
                'Sorry, You have missed your Punch-Out timeline for today!',
              data: {},
            });
          }
        }

        let totaltime = Math.abs(
          (new Date() - new Date(get_one_data.InDatetime)) / (1000 * 60)
        );
        totaltime = Math.round(totaltime - +get_one_data.OutHrs);
        // totaltime = Number(get_one_data.InHrs) + Number(minutes);
        if (
          +user_details.companyMasterId == 168 &&
          new Date(get_one_data.InDatetime) <
            new Date(
              get_one_data.AttendanceDate + ' ' + get_one_data.ShiftIntime
            )
        ) {
          const difference = Math.abs(
            (new Date(
              get_one_data.AttendanceDate + ' ' + get_one_data.ShiftIntime
            ) -
              new Date(get_one_data.InDatetime)) /
              (1000 * 60)
          );
          totaltime = Math.round(totaltime - +difference);
        }

        let fulldayHalfdayMinutes = 0,
          skipMinutes = 0;
        if (attendancePolicy) {
          if (attendancePolicy.considerWorkingHours == 'includingouthours') {
            fulldayHalfdayMinutes =
              Number(totaltime) + Number(get_one_data.OutHrs);
          } else {
            fulldayHalfdayMinutes = Number(totaltime);
          }

          // preshift hours consideration

          if (
            attendancePolicy.considerOvertimeAfter == 'totalworkinghours' &&
            attendancePolicy.preShiftHrsConsideration == 0
          ) {
            if (
              new Date(get_one_data.InDatetime) <
              new Date(
                get_one_data.AttendanceDate + ' ' + get_one_data.ShiftIntime
              )
            ) {
              const diffMilliseconds =
                new Date(
                  get_one_data.AttendanceDate + ' ' + get_one_data.ShiftIntime
                ) - new Date(get_one_data.InDatetime);

              skipMinutes = Math.floor(diffMilliseconds / (1000 * 60));
              // skip minutes from fulldayhalfday minutes

              fulldayHalfdayMinutes -= +skipMinutes;
            }
          }
        } else {
          fulldayHalfdayMinutes =
            Number(totaltime) + Number(get_one_data.OutHrs);
        }

        let day = new Date().toLocaleString('en-us', { weekday: 'long' });
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

        let earlyBy;
        const EarlybyMinutes = await calculateEarlyby(
          get_one_data.AttendanceDate,
          get_one_data.ShiftIntime,
          get_one_data.ShiftoutTime,
          new Date()
        );
        if (EarlybyMinutes) {
          earlyBy = EarlybyMinutes;
        } else {
          earlyBy = '';
        }

        //check this

        let attendancetransaction = await attendanceTransaction.findOne({
          where: {
            AttendanceTransID: get_one_data.AttendanceTransID,
          },
        });

        let dayname = new Date(
          attendancetransaction.AttendanceDate
        ).toLocaleString('en-us', {
          weekday: 'long',
        });
        let shiftid = Number(attendancetransaction.Shift);

        let shift_Grace = fulldayHalfdayMinutes;
        // -----------------grace minutes to send in overtime function----------
        let grace = 0;
        if (get_options.shift && get_options.shift.shiftGrace) {
          shift_Grace =
            Number(get_options.shift.shiftGrace) + fulldayHalfdayMinutes;

          grace = Number(get_options.shift.shiftGrace);
        }

        let weekOffMinutes = 0;
        let normalDayMinutes = shift_Grace;
        const findWeekOffData = await findWeekoff_Without_trans(
          attendancetransaction.userMasterID,
          attendancetransaction.AttendanceDate
        );

        if (
          findWeekOffData &&
          findWeekOffData.WHDayType == 'SH' &&
          +findWeekOffData.value == 0.5
        ) {
          const totalMinuteshalfday = get_options.totalhourshalfday * 60;
          // shift_Grace = 300
          if (
            attendancePolicy &&
            attendancePolicy.considerOvertimeAfter == 'totalworkinghours'
          ) {
            if (shift_Grace > totalMinuteshalfday) {
              weekOffMinutes = shift_Grace - totalMinuteshalfday;
              shift_Grace = shift_Grace - weekOffMinutes;
              normalDayMinutes = shift_Grace;
            }
          } else {
            if (
              new Date(attendancetransaction.InDatetime) <
              new Date(
                attendancetransaction.AttendanceDate +
                  ' ' +
                  get_options.firsthalfendtime
              )
            ) {
              if (
                new Date() >
                new Date(
                  attendancetransaction.AttendanceDate +
                    ' ' +
                    get_options.firsthalfendtime
                )
              ) {
                const inTime = new Date(
                  attendancetransaction.InDatetime
                ).getTime();
                const firstHalfEndTime = new Date(
                  attendancetransaction.AttendanceDate +
                    ' ' +
                    get_options.firsthalfendtime
                ).getTime();

                let differenceInMinutes = (firstHalfEndTime - inTime) / 60000; // Convert ms to minutes

                differenceInMinutes = differenceInMinutes - skipMinutes;
                if (differenceInMinutes > 0) {
                  weekOffMinutes = shift_Grace - differenceInMinutes;
                  shift_Grace = differenceInMinutes;
                  normalDayMinutes = shift_Grace;
                }
              } else if (
                new Date(attendancetransaction.InDatetime) >
                new Date(
                  attendancetransaction.AttendanceDate +
                    ' ' +
                    get_options.firsthalfendtime
                )
              ) {
                weekOffMinutes = shift_Grace;
                shift_Grace = 0;
                normalDayMinutes = shift_Grace;
              }
            }
          }
        }

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

        if (req.body.photo) {
          const [year, month] = today.split('-');
          let dataUrl = 'data:image/png;base64,' + req.body.photo;
          let fileName = `attendaceLogs_${
            req.body.userMasterID
          }_${Date.now()}.png`;
          let filePath = `uploads/attendaceLogs/${user_details.companyMasterId}/${month}${year}/`;
          req.body.photo = filePath + fileName;
          attendancePhotobase64Topng(dataUrl, fileName, filePath);
        }

        // set roundoff minutes
        let final_totaltime = Math.round(totaltime) + +get_one_data.OutHrs;
        let finalMinutes = +final_totaltime;

        if (
          attendancePolicy &&
          attendancePolicy.considerWorkingHours == 'notincludingouthours'
        ) {
          final_totaltime = +Math.round(totaltime);
          finalMinutes = +Math.round(totaltime);
        }

        let final_Minutes = Math.round(+final_totaltime) - +skipMinutes;

        const temp_final_Minutes = final_Minutes;

        if (
          salaryPolicy &&
          salaryPolicy.salarycalculationBasedon == 'hourwise' &&
          salaryPolicy.considerTimeType != 'actual'
        ) {
          if (salaryPolicy.considerTimeValue) {
            if (salaryPolicy.considerTimeType == 'slotwise') {
              final_Minutes =
                Math.floor(
                  Math.round(+final_Minutes) / +salaryPolicy.considerTimeValue
                ) * +salaryPolicy.considerTimeValue;
            }

            if (salaryPolicy.considerTimeType == 'roundoff') {
              final_Minutes =
                roundToNearestHour(
                  Math.round(+final_Minutes),
                  +salaryPolicy.considerTimeValue
                ) * 60;
            }
          }
        }

        const extraMinutes = +temp_final_Minutes - +final_Minutes;

        let change_data = await attendanceTransaction.update(
          {
            OutDateTime: new Date(),
            InHrs: +totaltime,
            EarlyBy: earlyBy,
            // Panalty: penalty,
            // PanaltyDeduction: penaltydeduction,
            fulldayhalfday: Number(fulldayhalfday[0].fulldayhalfday),
            punchOUTbranch: live_branch,
            locationTypeOUT: LocationType,
            roundOffMinutes:
              Math.round(+final_Minutes) > 0 ? Math.round(+final_Minutes) : 0,
            Panalty: null,
            PanaltyDeduction: null,
            goEarlyPanalty: null,
            goEarlyPanaltyDeduction: null,
            latePenaltyMinutes: null,
            earlyPenaltyMinutes: null,
          },
          {
            where: { AttendanceTransID: get_one_data.AttendanceTransID },
          }
        );
        insert_db = await AttendanceLogs.create({
          userMasterID: req.body.userMasterID,
          AttendanceTransID: get_one_data.AttendanceTransID,
          logDateTime: new Date(),
          direction: req.body.direction,
          photo: req.body.photo,
          attendnaceFrom: req.body.attendnaceFrom,
          longitude: req.body.longitude,
          latitude: req.body.latitude,
          address: req.body.address,
          createBy: req.body.createBy,
          createByIp: req.body.createByIp,
        });

        let isHoliday = await checkHoliday(
          get_one_data.userMasterID,
          get_one_data.AttendanceDate
        );
        if (isHoliday == 1) {
          let withoutOtMinutes = Math.round(+final_Minutes);
          let total_In_Hrs = Math.round(+final_Minutes);
          if (
            findWeekOffData &&
            findWeekOffData.WHDayType == 'SH' &&
            findWeekOffData.value == 0.5
          ) {
            total_In_Hrs = weekOffMinutes;
          } else {
            weekOffMinutes = Math.round(+final_Minutes);
            normalDayMinutes = 0;
          }
          if (attendancePolicy) {
            if (attendancePolicy.coff != null && attendancePolicy.coff != '') {
              //If Overtime
              if (attendancePolicy.coff == 'Overtime') {
                // -----------------add without ot minutes in attendance transaction-------------------------
                withoutOtMinutes = 0;
                await coffOvertimeMobile(
                  req.body.userMasterID,
                  get_one_data.AttendanceTransID,
                  user_details.companyMasterId,
                  attendancePolicy,
                  skipMinutes,
                  weekOffMinutes,
                  normalDayMinutes
                );
              } else if (attendancePolicy.coff == 'AddLeave') {
                await addCoffMobile(
                  get_one_data.userMasterID,
                  get_one_data.AttendanceDate,
                  user_details.companyMasterId,
                  attendancePolicy,
                  total_In_Hrs
                );
              } else if (attendancePolicy.coff == 'AddExtraDays') {
                await addExtraDaysMobile(
                  attendancePolicy,
                  attendancetransaction,
                  total_In_Hrs
                );
              }
            }
          }

          // update attendance transaction
          await attendanceTransaction.update(
            {
              withoutOtMinutes,
            },
            { where: { AttendanceTransID: get_one_data.AttendanceTransID } }
          );
        } else {
          let earlyattendancetransaction = await attendanceTransaction.findOne({
            where: {
              AttendanceTransID: get_one_data.AttendanceTransID,
            },
          });

          const LateEarlyPolicy =
            user_details.employeeLateEarlyPolicies &&
            user_details.employeeLateEarlyPolicies.length > 0
              ? user_details.employeeLateEarlyPolicies[0].lateEarlyPolicy
                ? user_details.employeeLateEarlyPolicies[0].lateEarlyPolicy
                    .dataValues
                : null
              : null;

          // Flag To add Onworking hours

          const toaddOnWorkingHours = LateEarlyPolicy
            ? LateEarlyPolicy.onWorkingHours
            : false;

          const finalAdd_LCEG =
            toaddOnWorkingHours &&
            +finalMinutes >= +earlyattendancetransaction.Shifthrs * 60
              ? false
              : true;

          if (
            LateEarlyPolicy &&
            LateEarlyPolicy.lateEarlyPolicyType == 'combined'
          ) {
            await combined_deductionMobile(
              earlyattendancetransaction,
              get_options.shift,
              shift_Grace,
              finalAdd_LCEG,
              salaryPolicy
            );
          } else {
            let goEarlyUsed = await earlyByPermission(
              earlyattendancetransaction,
              get_options.shift,
              earlyBy,
              shift_Grace,
              finalAdd_LCEG,
              salaryPolicy
            );

            if (goEarlyUsed && goEarlyUsed == 1) {
              let shift_Grace1 =
                Number(shift_Grace) + Number(get_options.shift.goEarly);

              let fulldayhalfday = await executeQuery(
                'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
                  shiftid +
                  ',' +
                  "'" +
                  dayname +
                  "'" +
                  ',' +
                  shift_Grace1 +
                  ')'
              );

              let change_data = await attendanceTransaction.update(
                {
                  goEarlyUsed: 1,
                  fulldayhalfday: Number(fulldayhalfday[0].fulldayhalfday),
                },
                {
                  where: { AttendanceTransID: get_one_data.AttendanceTransID },
                }
              );
            }

            let lateattendancetransaction = await attendanceTransaction.findOne(
              {
                where: {
                  AttendanceTransID: get_one_data.AttendanceTransID,
                },
              }
            );
            await lateComingPenalty(
              lateattendancetransaction,
              get_options.shift,
              shift_Grace,
              finalAdd_LCEG,
              salaryPolicy
            );
          }

          await overtimeMobile(
            req.body.userMasterID,
            get_one_data.AttendanceTransID,
            user_details,
            skipMinutes,
            extraMinutes,
            grace
          );
        }
        let finaltransation = await attendanceTransaction.findOne({
          where: {
            AttendanceTransID: get_one_data.AttendanceTransID,
          },
        });
        await addFoodAllowanceInAttendance(finaltransation);

        return res.json({
          status: 200,
          message: message.usermessage.punchout,
          data: {},
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

exports.attendanceData = async (req, res, next) => {
  try {
    if (req.body.startDate == '' && req.body.endDate == '') {
      let attendancetransaction = await attendanceTransaction.findAll({
        where: {
          userMasterID: req.body.userMasterID,
        },
        order: [['InDatetime', 'ASC']],
      });
      return res.json({
        status: 200,
        message: message.usermessage.attendancedata,
        data: attendancetransaction,
      });
    } else {
      let attendancetransaction = await attendanceTransaction.findAll({
        where: {
          userMasterID: req.body.userMasterID,
          AttendanceDate: {
            [Sequelize.Op.between]: [
              new Date(req.body.startDate),
              new Date(req.body.endDate),
            ],
          },
        },
        order: [['InDatetime', 'DESC']],
      });
      return res.json({
        status: 200,
        message: message.usermessage.attendancedata,
        data: attendancetransaction,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getovertimeuserwise = async (req, res, next) => {
  try {
    let { limit, page, startdate, enddate, userMasterID } = await req.body;
    let offset = (page - 1) * limit;

    let overTimeCalculations, totalcount;

    if (startdate && enddate) {
      overTimeCalculations = await overTimeCalculation.findAll({
        raw: true,
        where: {
          UserMasterID: userMasterID,
          OverTimeDate: {
            [Sequelize.Op.between]: [startdate, enddate],
          },
        },
        order: [['OverTimeDate', 'DESC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: attendanceTransaction,
            attributes: ['InDatetime', 'OutDateTime'],
          },
        ],
      });

      totalcount = await overTimeCalculation.count({
        where: {
          UserMasterID: userMasterID,
          OverTimeDate: {
            [Sequelize.Op.between]: [startdate, enddate],
          },
        },
      });
    } else {
      overTimeCalculations = await overTimeCalculation.findAll({
        raw: true,
        where: {
          UserMasterID: userMasterID,
        },
        order: [['OverTimeDate', 'DESC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: attendanceTransaction,
            attributes: ['InDatetime', 'OutDateTime'],
          },
        ],
      });
      totalcount = await overTimeCalculation.count({
        where: {
          UserMasterID: userMasterID,
        },
      });
    }

    const auth_Criteria = await AuthorizationDetails.findOne({
      row: true,
      where: {
        AuthorizationMasterID: authorizationMasterTypes.overtime,
        userMasterID: userMasterID,
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

    for (let i = 0; i < overTimeCalculations.length; i++) {
      overTimeCalculations[i].auth_Criteria =
        auth_Criteria && auth_Criteria.AuthorizationCriteriaMaster
          ? auth_Criteria.AuthorizationCriteriaMaster.AuthorizationCriteria
          : '';
    }

    return res.json({
      status: 200,
      message: message.usermessage.overtimedataget,
      data: overTimeCalculations,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.attendanceByUserid = async (req, res, next) => {
  try {
    const { userMasterID, page, limit, startdate, enddate } = req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['AttendanceDate', 'ASC']];
    if (userMasterID) condition.userMasterID = userMasterID;
    if (startdate && enddate)
      condition.AttendanceDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    const allAttendance = await attendanceTransaction.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: UserMaster }],
    });

    const userAttendacePolicy = await userMaster.findOne({
      where: { userMasterID: userMasterID },
      attributes: ['userMasterID'],
      include: [
        {
          model: EmployeeAttendancePolicy,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(),
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['attendancePolicyID'],
          include: [
            {
              model: AttendancePolicy,
              as: 'attendancePolicy',
              attributes: ['attendanceInMobile'],
            },
          ],
        },
      ],
    });

    let attendacepolicydata = 'TIME';
    if (
      userAttendacePolicy &&
      userAttendacePolicy.toJSON().employeeAttendancePolicies &&
      userAttendacePolicy.toJSON().employeeAttendancePolicies.length
    ) {
      attendacepolicydata =
        userAttendacePolicy.toJSON().employeeAttendancePolicies[0]
          .attendancePolicy.attendanceInMobile;
    }
    return res.status(200).json({
      status: 200,
      data: allAttendance.rows,
      totalcount: allAttendance.count,
      attendacepolicydata: attendacepolicydata,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getAttendanceLogsByTrnsactionId = async (req, res, next) => {
  try {
    const get_data = await executeQuery(
      `select * from  attendancelogs  where  "AttendanceTransID"= ${req.params.id} ORDER BY "logDateTime" DESC`
    );

    if (!get_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_data });
  } catch (err) {
    next(err);
  }
};

exports.attendancepareport = async (req, res, next) => {
  try {
    let { page, limit } = req.body;
    let offset = (page - 1) * limit;
    let maindata = [];
    let totalcount;
    let date = new Date().toISOString().slice(0, 10);
    if (page == '' && limit == '') {
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
          req.body.companyid +
          ` ) as A where A."userMasterID" IN (` +
          req.body.user +
          `) order by A."displayName" ASC`
      );

      function getDatesFromDateRange(from, to) {
        const dates = [];
        for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
          const cloned = new Date(date.valueOf());
          dates.push(cloned);
        }
        return dates;
      }

      const start = new Date(req.body.fromdate);
      const end = new Date(req.body.todate);

      const datesArray = getDatesFromDateRange(start, end);

      for (var i = 0; i < usermaster.length; i++) {
        let attendancedata = [];
        let totalpresentday = 0;
        let totalabsentday = 0;
        let totalhalfday = 0;
        let totalweekoffholiday = 0;
        let totalpunchedout = 0;
        for (var j = 0; j < datesArray.length; j++) {
          let attendance = await attendanceTransaction.findOne({
            where: {
              AttendanceDate: datesArray[j],
              userMasterID: usermaster[i].userMasterID,
              Status: 1,
            },
          });

          let weekholidaydata = await weekoffHolidayTran.findOne({
            where: {
              userMasterID: usermaster[i].userMasterID,
              date: datesArray[j],
              [Sequelize.Op.or]: [
                { optionalHoliday: false },
                { optionalHoliday: null },
              ],
            },
            order: [['date', 'ASC']],
          });
          let data;
          function toHoursAndMinutes(totalMinutes) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return hours + ' : ' + minutes;
          }
          if (attendance) {
            if (attendance.fulldayhalfday == 0) {
              var diff = 0;
              var minutes = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);
              }
              data = {
                attendancedate: datesArray[j],
                attendancetype: 'A',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
              };
              totalabsentday = totalabsentday + 1;
            } else if (attendance.fulldayhalfday == 1) {
              var diff = 0;
              var minutes = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);
              }
              data = {
                attendancedate: datesArray[j],
                attendancetype: 'P',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
              };
              totalpresentday = totalpresentday + 1;
            } else if (attendance.fulldayhalfday == 0.5) {
              var diff = 0;
              var minutes = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);
              }

              data = {
                attendancedate: datesArray[j],
                attendancetype: 'HD',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
              };
              totalhalfday = totalhalfday + 1;
            } else {
              var diff = 0;
              var minutes = 0;
              data = {
                attendancedate: datesArray[j],
                attendancetype: 'Not Punched Out',
                intime: attendance.InDatetime,
                outtime: 'Not Punched Out',
                minutes: minutes,
              };
              totalpunchedout = totalpunchedout + 1;
            }
          } else {
            if (weekholidaydata) {
              if (weekholidaydata.tableName == 'weekoff') {
                var diff = 0;
                var minutes = 0;

                data = {
                  attendancedate: datesArray[j],
                  attendancetype: 'WeekOff',
                  intime: 'Weekoff',
                  outtime: 'Weekoff',
                  minutes: minutes,
                };
                totalweekoffholiday = totalweekoffholiday + 1;
              } else {
                var diff = 0;
                var minutes = 0;

                data = {
                  attendancedate: datesArray[j],
                  attendancetype: 'Holiday',
                  intime: 'Holiday',
                  outtime: 'Holiday',
                  minutes: minutes,
                };
                totalweekoffholiday = totalweekoffholiday + 1;
              }
            } else {
              if (new Date(datesArray[j]) > new Date()) {
                var diff = 0;
                var minutes = 0;
                data = {
                  attendancedate: datesArray[j],
                  attendancetype: '',
                  intime: '-',
                  outtime: '-',
                  minutes: '-',
                };
              } else {
                var diff = 0;
                var minutes = 0;
                data = {
                  attendancedate: datesArray[j],
                  attendancetype: 'A',
                  intime: '-',
                  outtime: '-',
                  minutes: '-',
                };
                totalabsentday = totalabsentday + 1;
              }
            }
          }
          attendancedata.push(data);
        }

        let assignbranch;
        let branch_contact = await EmployeeBranch.findOne({
          raw: true,
          where: {
            userMasterID: usermaster[i].userMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(
                new Date(date).setHours(23, 59, 59, 999)
              ),
            },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.eq]: null } },
              { endDate: { [Sequelize.Op.gte]: date } },
            ],
            status: 1,
          },
        });

        assignbranch = branch_contact
          ? branch_contact['branchMaster.branchName']
          : '';

        let assigndepartment;
        let department_contact = await EmployeeDepartment.findOne({
          raw: true,
          where: {
            userMasterID: usermaster[i].userMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(
                new Date(date).setHours(23, 59, 59, 999)
              ),
            },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.eq]: null } },
              { endDate: { [Sequelize.Op.gte]: date } },
            ],
            status: 1,
          },
        });

        assigndepartment = department_contact
          ? department_contact['department.departmentName']
          : '';

        let assigndesignation;

        let designation_contact = await EmployeeDesignation.findOne({
          raw: true,
          where: {
            userMasterID: usermaster[i].userMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(
                new Date(date).setHours(23, 59, 59, 999)
              ),
            },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.eq]: null } },
              { endDate: { [Sequelize.Op.gte]: date } },
            ],
            status: 1,
          },
        });

        assigndesignation = designation_contact
          ? designation_contact['designation.designationName']
          : '';

        let joiningdata = await EmployeeJoiningDetails.findOne({
          where: {
            userMasterID: usermaster[i].userMasterID,
          },
        });
        let employeecode;
        if (joiningdata) {
          employeecode = joiningdata.employeeCode;
        } else {
          employeecode = '';
        }

        maindata.push({
          userMasterID: usermaster[i].userMasterID,
          employeecode: employeecode,
          userName: usermaster[i].displayName,
          userNumber: usermaster[i].userNumber,
          branch: assignbranch,
          department: assigndepartment,
          designation: assigndesignation,
          attendancedata: attendancedata,
          totalpresentday: totalpresentday,
          totalabsentday: totalabsentday,
          totalhalfday: totalhalfday,
          totalpunchedout: totalpunchedout,
          totalweekoffholiday: totalweekoffholiday,
        });
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
          req.body.companyid +
          ` ) as A where A."userMasterID" IN (` +
          req.body.user +
          `) `
      );
    } else {
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
          req.body.companyid +
          ` ) as A where A."userMasterID" IN (` +
          req.body.user +
          `) order by A."displayName" ASC LIMIT ` +
          limit +
          ` OFFSET ` +
          offset +
          ``
      );

      function getDatesFromDateRange(from, to) {
        const dates = [];
        for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
          const cloned = new Date(date.valueOf());
          dates.push(cloned);
        }
        return dates;
      }

      const start = new Date(req.body.fromdate);
      const end = new Date(req.body.todate);

      const datesArray = getDatesFromDateRange(start, end);

      for (var i = 0; i < usermaster.length; i++) {
        let attendancedata = [];
        let totalpresentday = 0;
        let totalabsentday = 0;
        let totalhalfday = 0;
        let totalweekoffholiday = 0;
        let totalpunchedout = 0;
        for (var j = 0; j < datesArray.length; j++) {
          let attendance = await attendanceTransaction.findOne({
            where: {
              AttendanceDate: datesArray[j],
              userMasterID: usermaster[i].userMasterID,
              Status: 1,
            },
          });

          let weekholidaydata = await weekoffHolidayTran.findOne({
            where: {
              userMasterID: usermaster[i].userMasterID,
              date: datesArray[j],
              [Sequelize.Op.or]: [
                { optionalHoliday: false },
                { optionalHoliday: null },
              ],
            },
            order: [['date', 'ASC']],
          });

          let data;

          function toHoursAndMinutes(totalMinutes) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return hours + ' : ' + minutes;
          }
          if (attendance) {
            if (attendance.fulldayhalfday == 0) {
              var diff = 0;
              var minutes = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);
              }
              data = {
                attendancedate: datesArray[j],
                attendancetype: 'A',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
              };
              totalabsentday = totalabsentday + 1;
            } else if (attendance.fulldayhalfday == 1) {
              var diff = 0;
              var minutes = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);
              }
              data = {
                attendancedate: datesArray[j],
                attendancetype: 'P',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
              };
              totalpresentday = totalpresentday + 1;
            } else if (attendance.fulldayhalfday == 0.5) {
              var diff = 0;
              var minutes = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);
              }

              data = {
                attendancedate: datesArray[j],
                attendancetype: 'HD',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
              };
              totalhalfday = totalhalfday + 1;
            } else {
              var diff = 0;
              var minutes = 0;
              data = {
                attendancedate: datesArray[j],
                attendancetype: 'Not Punched Out',
                intime: attendance.InDatetime,
                outtime: 'Not Punched Out',
                minutes: minutes,
              };
              totalpunchedout = totalpunchedout + 1;
            }
          } else {
            if (weekholidaydata) {
              if (weekholidaydata.tableName == 'weekoff') {
                var diff = 0;
                var minutes = 0;

                data = {
                  attendancedate: datesArray[j],
                  attendancetype: 'WeekOff',
                  intime: 'Weekoff',
                  outtime: 'Weekoff',
                  minutes: minutes,
                };
                totalweekoffholiday = totalweekoffholiday + 1;
              } else {
                var diff = 0;
                var minutes = 0;

                data = {
                  attendancedate: datesArray[j],
                  attendancetype: 'Holiday',
                  intime: 'Holiday',
                  outtime: 'Holiday',
                  minutes: minutes,
                };
                totalweekoffholiday = totalweekoffholiday + 1;
              }
            } else {
              if (new Date(datesArray[j]) > new Date()) {
                var diff = 0;
                var minutes = 0;
                data = {
                  attendancedate: datesArray[j],
                  attendancetype: '',
                  intime: '-',
                  outtime: '-',
                  minutes: '-',
                };
              } else {
                var diff = 0;
                var minutes = 0;
                data = {
                  attendancedate: datesArray[j],
                  attendancetype: 'A',
                  intime: '-',
                  outtime: '-',
                  minutes: '-',
                };
                totalabsentday = totalabsentday + 1;
              }
            }
          }
          attendancedata.push(data);
        }

        let assignbranch;
        let branch_contact = await EmployeeBranch.findOne({
          raw: true,
          where: {
            userMasterID: usermaster[i].userMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(
                new Date(date).setHours(23, 59, 59, 999)
              ),
            },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.eq]: null } },
              { endDate: { [Sequelize.Op.gte]: date } },
            ],
            status: 1,
          },
        });

        assignbranch = branch_contact
          ? branch_contact['branchMaster.branchName']
          : '';

        let assigndepartment;
        let department_contact = await EmployeeDepartment.findOne({
          raw: true,
          where: {
            userMasterID: usermaster[i].userMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(
                new Date(date).setHours(23, 59, 59, 999)
              ),
            },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.eq]: null } },
              { endDate: { [Sequelize.Op.gte]: date } },
            ],
            status: 1,
          },
        });

        assigndepartment = department_contact
          ? department_contact['department.departmentName']
          : '';

        let assigndesignation;

        let designation_contact = await EmployeeDesignation.findOne({
          raw: true,
          where: {
            userMasterID: usermaster[i].userMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(
                new Date(date).setHours(23, 59, 59, 999)
              ),
            },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.eq]: null } },
              { endDate: { [Sequelize.Op.gte]: date } },
            ],
            status: 1,
          },
        });

        assigndesignation = designation_contact
          ? designation_contact['designation.designationName']
          : '';

        let joiningdata = await EmployeeJoiningDetails.findOne({
          where: {
            userMasterID: usermaster[i].userMasterID,
          },
        });
        let employeecode;
        if (joiningdata) {
          employeecode = joiningdata.employeeCode;
        } else {
          employeecode = '';
        }

        maindata.push({
          userMasterID: usermaster[i].userMasterID,
          employeecode: employeecode,
          userName: usermaster[i].displayName,
          userNumber: usermaster[i].userNumber,
          branch: assignbranch,
          department: assigndepartment,
          designation: assigndesignation,
          attendancedata: attendancedata,
          totalpresentday: totalpresentday,
          totalabsentday: totalabsentday,
          totalhalfday: totalhalfday,
          totalpunchedout: totalpunchedout,
          totalweekoffholiday: totalweekoffholiday,
        });
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
          req.body.companyid +
          ` ) as A  where A."userMasterID" IN (` +
          req.body.user +
          `) `
      );
    }
    return res.status(200).json({
      status: 200,
      data: maindata,
      totalCount: Number(totalcount[0].count),
    });
  } catch (err) {
    next(err);
  }
};

exports.attendancepareport2 = async (req, res, next) => {
  try {
    let { page, limit } = req.body;
    let offset = (page - 1) * limit;
    let maindata = [];
    let totalcount;
    let date = new Date().toISOString().slice(0, 10);
    if (page == '' && limit == '') {
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
          req.body.companyid +
          ` ) as A where A."userMasterID" IN (` +
          req.body.user +
          `) order by A."displayName" ASC`
      );

      function getDatesFromDateRange(from, to) {
        const dates = [];
        for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
          const cloned = new Date(date.valueOf());
          dates.push(cloned);
        }
        return dates;
      }

      const start = new Date(req.body.fromdate);
      const end = new Date(req.body.todate);

      const datesArray = getDatesFromDateRange(start, end);

      for (var i = 0; i < usermaster.length; i++) {
        let attendancedata = [];
        let totalpresentday = 0;
        let totalabsentday = 0;
        let totalhalfday = 0;
        let totalweekoffholiday = 0;
        let totalpunchedout = 0;

        let joiningdata = await EmployeeJoiningDetails.findOne({
          where: {
            userMasterID: usermaster[i].userMasterID,
          },
        });
        let employeecode;
        if (joiningdata) {
          employeecode = joiningdata.employeeCode;
        } else {
          employeecode = '';
        }

        for (var j = 0; j < datesArray.length; j++) {
          let attendance = await attendanceTransaction.findOne({
            where: {
              AttendanceDate: datesArray[j],
              userMasterID: usermaster[i].userMasterID,
              Status: 1,
            },
          });

          let weekholidaydata = await weekoffHolidayTran.findOne({
            where: {
              userMasterID: usermaster[i].userMasterID,
              date: datesArray[j],
              [Sequelize.Op.or]: [
                { optionalHoliday: false },
                { optionalHoliday: null },
              ],
            },
            order: [['date', 'ASC']],
          });

          let assignbranch;
          let branch_contact = await EmployeeBranch.findOne({
            raw: true,
            where: {
              userMasterID: usermaster[i].userMasterID,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(
                  new Date(date).setHours(23, 59, 59, 999)
                ),
              },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.eq]: null } },
                { endDate: { [Sequelize.Op.gte]: date } },
              ],
              status: 1,
            },
          });

          assignbranch = branch_contact
            ? branch_contact['branchMaster.branchName']
            : '';

          let assigndepartment;
          let department_contact = await EmployeeDepartment.findOne({
            raw: true,
            where: {
              userMasterID: usermaster[i].userMasterID,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(
                  new Date(date).setHours(23, 59, 59, 999)
                ),
              },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.eq]: null } },
                { endDate: { [Sequelize.Op.gte]: date } },
              ],
              status: 1,
            },
          });

          assigndepartment = department_contact
            ? department_contact['department.departmentName']
            : '';

          let assigndesignation;

          let designation_contact = await EmployeeDesignation.findOne({
            raw: true,
            where: {
              userMasterID: usermaster[i].userMasterID,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(
                  new Date(date).setHours(23, 59, 59, 999)
                ),
              },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.eq]: null } },
                { endDate: { [Sequelize.Op.gte]: date } },
              ],
              status: 1,
            },
          });

          assigndesignation = designation_contact
            ? designation_contact['designation.designationName']
            : '';

          let data;

          function toHoursAndMinutes(totalMinutes) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return hours + ' : ' + minutes;
          }
          if (attendance) {
            if (attendance.fulldayhalfday == 0) {
              var diff = 0;
              var minutes = 0;
              var minutes1 = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);

                const dateOne = attendance.InDatetime;
                const dateTwo = attendance.OutDateTime;
                const dateOneObj = new Date(dateOne);
                const dateTwoObj = new Date(dateTwo);
                const milliseconds = Math.abs(dateTwoObj - dateOneObj);
                const hours = milliseconds / 36e5;

                minutes1 = hours * 60;
              }

              data = {
                userName: usermaster[i].displayName,
                userNumber: usermaster[i].userNumber,
                employeecode: employeecode,
                branch: assignbranch,
                department: assigndepartment,
                designation: assigndesignation,
                attendancedate: datesArray[j],
                attendancetype: 'A',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
                finalminutes: minutes1,
              };
              totalabsentday = totalabsentday + 1;
            } else if (attendance.fulldayhalfday == 1) {
              var diff = 0;
              var minutes = 0;
              var minutes1 = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);

                const dateOne = attendance.InDatetime;
                const dateTwo = attendance.OutDateTime;
                const dateOneObj = new Date(dateOne);
                const dateTwoObj = new Date(dateTwo);
                const milliseconds = Math.abs(dateTwoObj - dateOneObj);
                const hours = milliseconds / 36e5;

                minutes1 = hours * 60;
              }
              data = {
                userName: usermaster[i].displayName,
                userNumber: usermaster[i].userNumber,
                employeecode: employeecode,
                branch: assignbranch,
                department: assigndepartment,
                designation: assigndesignation,
                attendancedate: datesArray[j],
                attendancetype: 'P',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
                finalminutes: minutes1,
              };
              totalpresentday = totalpresentday + 1;
            } else if (attendance.fulldayhalfday == 0.5) {
              var diff = 0;
              var minutes = 0;
              var minutes1 = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);

                const dateOne = attendance.InDatetime;
                const dateTwo = attendance.OutDateTime;
                const dateOneObj = new Date(dateOne);
                const dateTwoObj = new Date(dateTwo);
                const milliseconds = Math.abs(dateTwoObj - dateOneObj);
                const hours = milliseconds / 36e5;

                minutes1 = hours * 60;
              }

              data = {
                userName: usermaster[i].displayName,
                userNumber: usermaster[i].userNumber,
                employeecode: employeecode,
                branch: assignbranch,
                department: assigndepartment,
                designation: assigndesignation,
                attendancedate: datesArray[j],
                attendancetype: 'HD',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
                finalminutes: minutes1,
              };
              totalhalfday = totalhalfday + 1;
            } else {
              var diff = 0;
              var minutes = 0;
              var minutes1 = 0;
              data = {
                userName: usermaster[i].displayName,
                userNumber: usermaster[i].userNumber,
                employeecode: employeecode,
                branch: assignbranch,
                department: assigndepartment,
                designation: assigndesignation,
                attendancedate: datesArray[j],
                attendancetype: 'Not Punched Out',
                intime: attendance.InDatetime,
                outtime: 'Not Punched Out',
                minutes: minutes,
                finalminutes: minutes1,
              };
              totalpunchedout = totalpunchedout + 1;
            }
          } else {
            if (weekholidaydata) {
              if (weekholidaydata.tableName == 'weekoff') {
                var diff = 0;
                var minutes = 0;
                var minutes1 = 0;

                data = {
                  userName: usermaster[i].displayName,
                  userNumber: usermaster[i].userNumber,
                  employeecode: employeecode,
                  branch: assignbranch,
                  department: assigndepartment,
                  designation: assigndesignation,
                  attendancedate: datesArray[j],
                  attendancetype: 'WeekOff',
                  intime: 'Weekoff',
                  outtime: 'Weekoff',
                  minutes: minutes,
                  finalminutes: minutes1,
                };
                totalweekoffholiday = totalweekoffholiday + 1;
              } else {
                var diff = 0;
                var minutes = 0;
                var minutes1 = 0;

                data = {
                  userName: usermaster[i].displayName,
                  userNumber: usermaster[i].userNumber,
                  employeecode: employeecode,
                  branch: assignbranch,
                  department: assigndepartment,
                  designation: assigndesignation,
                  attendancedate: datesArray[j],
                  attendancetype: 'Holiday',
                  intime: 'Holiday',
                  outtime: 'Holiday',
                  minutes: minutes,
                  finalminutes: minutes1,
                };
                totalweekoffholiday = totalweekoffholiday + 1;
              }
            } else {
              if (new Date(datesArray[j]) > new Date()) {
                var diff = 0;
                var minutes = 0;
                var minutes1 = 0;
                data = {
                  userName: usermaster[i].displayName,
                  userNumber: usermaster[i].userNumber,
                  employeecode: employeecode,
                  branch: assignbranch,
                  department: assigndepartment,
                  designation: assigndesignation,
                  attendancedate: datesArray[j],
                  attendancetype: '',
                  intime: '-',
                  outtime: '-',
                  minutes: '-',
                  finalminutes: 0,
                };
              } else {
                var diff = 0;
                var minutes = 0;
                data = {
                  userName: usermaster[i].displayName,
                  userNumber: usermaster[i].userNumber,
                  employeecode: employeecode,
                  branch: assignbranch,
                  department: assigndepartment,
                  designation: assigndesignation,
                  attendancedate: datesArray[j],
                  attendancetype: 'A',
                  intime: '-',
                  outtime: '-',
                  minutes: '-',
                  finalminutes: 0,
                };
                totalabsentday = totalabsentday + 1;
              }
            }
          }
          attendancedata.push(data);
        }

        maindata.push({
          userMasterID: usermaster[i].userMasterID,
          userName: usermaster[i].displayName,
          userNumber: usermaster[i].userNumber,
          employeecode: employeecode,
          // branch: assignbranch,
          // department: assigndepartment,
          // designation: assigndesignation,
          attendancedata: attendancedata,
          totalpresentday: totalpresentday,
          totalabsentday: totalabsentday,
          totalhalfday: totalhalfday,
          totalpunchedout: totalpunchedout,
          totalweekoffholiday: totalweekoffholiday,
        });
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
          req.body.companyid +
          ` ) as A where A."userMasterID" IN (` +
          req.body.user +
          `) `
      );
    } else {
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
          req.body.companyid +
          ` ) as A where A."userMasterID" IN (` +
          req.body.user +
          `) order by A."displayName" ASC LIMIT ` +
          limit +
          ` OFFSET ` +
          offset +
          ``
      );

      function getDatesFromDateRange(from, to) {
        const dates = [];
        for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
          const cloned = new Date(date.valueOf());
          dates.push(cloned);
        }
        return dates;
      }

      const start = new Date(req.body.fromdate);
      const end = new Date(req.body.todate);

      const datesArray = getDatesFromDateRange(start, end);

      for (var i = 0; i < usermaster.length; i++) {
        let attendancedata = [];
        let totalpresentday = 0;
        let totalabsentday = 0;
        let totalhalfday = 0;
        let totalweekoffholiday = 0;
        let totalpunchedout = 0;

        let joiningdata = await EmployeeJoiningDetails.findOne({
          where: {
            userMasterID: usermaster[i].userMasterID,
          },
        });
        let employeecode;
        if (joiningdata) {
          employeecode = joiningdata.employeeCode;
        } else {
          employeecode = '';
        }

        for (var j = 0; j < datesArray.length; j++) {
          let attendance = await attendanceTransaction.findOne({
            where: {
              AttendanceDate: datesArray[j],
              userMasterID: usermaster[i].userMasterID,
              Status: 1,
            },
          });

          let weekholidaydata = await weekoffHolidayTran.findOne({
            where: {
              userMasterID: usermaster[i].userMasterID,
              date: datesArray[j],
              [Sequelize.Op.or]: [
                { optionalHoliday: false },
                { optionalHoliday: null },
              ],
            },
            order: [['date', 'ASC']],
          });

          let assignbranch;
          let branch_contact = await EmployeeBranch.findOne({
            raw: true,
            where: {
              userMasterID: usermaster[i].userMasterID,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(
                  new Date(datesArray[j]).setHours(23, 59, 59, 999)
                ),
              },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.eq]: null } },
                { endDate: { [Sequelize.Op.gte]: datesArray[j] } },
              ],
              status: 1,
            },
          });

          assignbranch = branch_contact
            ? branch_contact['branchMaster.branchName']
            : '';

          let assigndepartment;
          let department_contact = await EmployeeDepartment.findOne({
            raw: true,
            where: {
              userMasterID: usermaster[i].userMasterID,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(
                  new Date(datesArray[j]).setHours(23, 59, 59, 999)
                ),
              },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.eq]: null } },
                { endDate: { [Sequelize.Op.gte]: datesArray[j] } },
              ],
              status: 1,
            },
          });

          assigndepartment = department_contact
            ? department_contact['department.departmentName']
            : '';

          let assigndesignation;

          let designation_contact = await EmployeeDesignation.findOne({
            raw: true,
            where: {
              userMasterID: usermaster[i].userMasterID,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(
                  new Date(datesArray[j]).setHours(23, 59, 59, 999)
                ),
              },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.eq]: null } },
                { endDate: { [Sequelize.Op.gte]: datesArray[j] } },
              ],
              status: 1,
            },
          });

          assigndesignation = designation_contact
            ? designation_contact['designation.designationName']
            : '';

          let data;

          function toHoursAndMinutes(totalMinutes) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return hours + ' : ' + minutes;
          }
          if (attendance) {
            if (attendance.fulldayhalfday == 0) {
              var diff = 0;
              var minutes = 0;
              var minutes1 = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);

                const dateOne = attendance.InDatetime;
                const dateTwo = attendance.OutDateTime;
                const dateOneObj = new Date(dateOne);
                const dateTwoObj = new Date(dateTwo);
                const milliseconds = Math.abs(dateTwoObj - dateOneObj);
                const hours = milliseconds / 36e5;

                minutes1 = hours * 60;
              }
              data = {
                userName: usermaster[i].displayName,
                userNumber: usermaster[i].userNumber,
                employeecode: employeecode,
                branch: assignbranch,
                department: assigndepartment,
                designation: assigndesignation,
                attendancedate: datesArray[j],
                attendancetype: 'A',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
                finalminutes: minutes1,
              };
              totalabsentday = totalabsentday + 1;
            } else if (attendance.fulldayhalfday == 1) {
              var diff = 0;
              var minutes = 0;
              var minutes1 = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);
                const dateOne = attendance.InDatetime;
                const dateTwo = attendance.OutDateTime;
                const dateOneObj = new Date(dateOne);
                const dateTwoObj = new Date(dateTwo);
                const milliseconds = Math.abs(dateTwoObj - dateOneObj);
                const hours = milliseconds / 36e5;

                minutes1 = hours * 60;
              }
              data = {
                userName: usermaster[i].displayName,
                userNumber: usermaster[i].userNumber,
                employeecode: employeecode,
                branch: assignbranch,
                department: assigndepartment,
                designation: assigndesignation,
                attendancedate: datesArray[j],
                attendancetype: 'P',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
                finalminutes: minutes1,
              };
              totalpresentday = totalpresentday + 1;
            } else if (attendance.fulldayhalfday == 0.5) {
              var diff = 0;
              var minutes = 0;
              var minutes1 = 0;
              if (attendance.OutDateTime) {
                diff = Math.abs(
                  new Date(attendance.OutDateTime) -
                    new Date(new Date(attendance.InDatetime))
                );
                minutes = Math.floor(diff / 1000 / 60);

                const dateOne = attendance.InDatetime;
                const dateTwo = attendance.OutDateTime;
                const dateOneObj = new Date(dateOne);
                const dateTwoObj = new Date(dateTwo);
                const milliseconds = Math.abs(dateTwoObj - dateOneObj);
                const hours = milliseconds / 36e5;

                minutes1 = hours * 60;
              }

              data = {
                userName: usermaster[i].displayName,
                userNumber: usermaster[i].userNumber,
                employeecode: employeecode,
                branch: assignbranch,
                department: assigndepartment,
                designation: assigndesignation,
                attendancedate: datesArray[j],
                attendancetype: 'HD',
                intime: attendance.InDatetime,
                outtime: attendance.OutDateTime,
                minutes: toHoursAndMinutes(minutes),
                finalminutes: minutes1,
              };
              totalhalfday = totalhalfday + 1;
            } else {
              var diff = 0;
              var minutes = 0;
              data = {
                userName: usermaster[i].displayName,
                userNumber: usermaster[i].userNumber,
                employeecode: employeecode,
                branch: assignbranch,
                department: assigndepartment,
                designation: assigndesignation,
                attendancedate: datesArray[j],
                attendancetype: 'Not Punched Out',
                intime: attendance.InDatetime,
                outtime: 'Not Punched Out',
                minutes: minutes,
                finalminutes: 0,
              };
              totalpunchedout = totalpunchedout + 1;
            }
          } else {
            if (weekholidaydata) {
              if (weekholidaydata.tableName == 'weekoff') {
                var diff = 0;
                var minutes = 0;

                data = {
                  userName: usermaster[i].displayName,
                  userNumber: usermaster[i].userNumber,
                  employeecode: employeecode,
                  branch: assignbranch,
                  department: assigndepartment,
                  designation: assigndesignation,
                  attendancedate: datesArray[j],
                  attendancetype: 'WeekOff',
                  intime: 'Weekoff',
                  outtime: 'Weekoff',
                  minutes: minutes,
                  finalminutes: 0,
                };
                totalweekoffholiday = totalweekoffholiday + 1;
              } else {
                var diff = 0;
                var minutes = 0;

                data = {
                  userName: usermaster[i].displayName,
                  userNumber: usermaster[i].userNumber,
                  employeecode: employeecode,
                  branch: assignbranch,
                  department: assigndepartment,
                  designation: assigndesignation,
                  attendancedate: datesArray[j],
                  attendancetype: 'Holiday',
                  intime: 'Holiday',
                  outtime: 'Holiday',
                  minutes: minutes,
                  finalminutes: 0,
                };
                totalweekoffholiday = totalweekoffholiday + 1;
              }
            } else {
              if (new Date(datesArray[j]) > new Date()) {
                var diff = 0;
                var minutes = 0;
                data = {
                  userName: usermaster[i].displayName,
                  userNumber: usermaster[i].userNumber,
                  employeecode: employeecode,
                  branch: assignbranch,
                  department: assigndepartment,
                  designation: assigndesignation,
                  attendancedate: datesArray[j],
                  attendancetype: '',
                  intime: '-',
                  outtime: '-',
                  minutes: '-',
                  finalminutes: 0,
                };
              } else {
                var diff = 0;
                var minutes = 0;
                data = {
                  userName: usermaster[i].displayName,
                  userNumber: usermaster[i].userNumber,
                  employeecode: employeecode,
                  branch: assignbranch,
                  department: assigndepartment,
                  designation: assigndesignation,
                  attendancedate: datesArray[j],
                  attendancetype: 'A',
                  intime: '-',
                  outtime: '-',
                  minutes: '-',
                  finalminutes: 0,
                };
                totalabsentday = totalabsentday + 1;
              }
            }
          }
          attendancedata.push(data);
        }

        maindata.push({
          userMasterID: usermaster[i].userMasterID,
          userName: usermaster[i].displayName,
          userNumber: usermaster[i].userNumber,
          employeecode: employeecode,
          // branch: assignbranch,
          // department: assigndepartment,
          // designation: assigndesignation,
          attendancedata: attendancedata,
          totalpresentday: totalpresentday,
          totalabsentday: totalabsentday,
          totalhalfday: totalhalfday,
          totalpunchedout: totalpunchedout,
          totalweekoffholiday: totalweekoffholiday,
        });
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
          req.body.companyid +
          ` ) as A  where A."userMasterID" IN (` +
          req.body.user +
          `) `
      );
    }
    return res.status(200).json({
      status: 200,
      data: maindata,
      totalCount: Number(totalcount[0].count),
    });
  } catch (err) {
    next(err);
  }
};

exports.attendancereport = async (req, res, next) => {
  try {
    const { userMasterID, fromdate, todate, limit, page, exportData } =
      await req.body;

    let fromdate1 = new Date(
      new Date(new Date(fromdate).setHours(0, 0, 0, 0))
        .toString()
        .split('GMT')[0] + ' UTC'
    ).toISOString();
    let enddate1 = new Date(
      new Date(new Date(todate).setHours(23, 59, 59, 999))
        .toString()
        .split('GMT')[0] + ' UTC'
    ).toISOString();

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [];
    if (exportData) order.push(['userMasterID', 'ASC'], ['logDateTime', 'ASC']);
    else order.push(['logDateTime', 'DESC'], ['attendanceLogID', 'DESC']);

    const attendance_data = await AttendanceLogs.findAndCountAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
        logDateTime: {
          [Sequelize.Op.between]: [new Date(fromdate1), new Date(enddate1)],
        },
      },
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          attributes: [
            ['displayName', 'displayName'],
            ['userNumber', 'userNumber'],
          ],
          include: [
            {
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
        {
          model: attendanceTransaction,
          attributes: ['branchID', 'AttendanceDate'],
          include: [
            { model: BranchMaster, attributes: ['branchName'] },
            { model: Department, attributes: ['departmentName'] },
            { model: Designation, attributes: ['designationName'] },
          ],
        },
      ],
    });

    for (let item of attendance_data.rows) {
      if (
        +item.AttendanceTransID == attendaceTransType.biometricNotValidated ||
        +item.AttendanceTransID == attendaceTransType.tpMirrorNotValidated
      )
        item.direction = attendanceTransactionType.notValidated;
      if (
        +item.AttendanceTransID == attendaceTransType.biometricNC ||
        +item.AttendanceTransID == attendaceTransType.tpMirrorNC
      )
        item.direction = attendanceTransactionType.notConsider;
    }

    if (exportData) {
      const finalData = [];

      for (let item of attendance_data.rows) {
        const logDateTime = new Date(item.dataValues.logDateTime);
        const formattedDate = `${logDateTime
          .getDate()
          .toString()
          .padStart(2, '0')}-${(logDateTime.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${logDateTime.getFullYear()} ${logDateTime
          .getHours()
          .toString()
          .padStart(2, '0')}:${logDateTime
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

        const tempObj = {
          'Employee Code':
            item.dataValues.userMaster.dataValues.employeeJoiningDetails
              .length > 0
              ? item.dataValues.userMaster.dataValues.employeeJoiningDetails[0]
                  .dataValues.employeeCode
              : '',
          'Employee Name': item.dataValues.userMaster.displayName,
          'Employee Number': item.dataValues.userMaster.userNumber,
          Branch:
            item.dataValues.attendanceTransaction &&
            item.dataValues.attendanceTransaction.branchMaster
              ? item.dataValues.attendanceTransaction.branchMaster.branchName
              : '',
          Department:
            item.dataValues.attendanceTransaction &&
            item.dataValues.attendanceTransaction.department
              ? item.dataValues.attendanceTransaction.department.departmentName
              : '',
          Designation:
            item.dataValues.attendanceTransaction &&
            item.dataValues.attendanceTransaction.designation
              ? item.dataValues.attendanceTransaction.designation
                  .designationName
              : '',
          'Attendance Date': item.dataValues.attendanceTransaction
            ? item.dataValues.attendanceTransaction.AttendanceDate.toString()
                .split('-')
                .reverse()
                .join('-')
            : '',
          'Log Date Time': formattedDate,
          Direction: item.dataValues.direction,
          'Log From': item.dataValues.attendnaceFrom,
          Latitude: item.dataValues.latitude,
          Longitude: item.dataValues.longitude,
          Address: item.dataValues.address,
          image: item.dataValues.photo,
        };
        finalData.push(tempObj);
      }

      await generateExcelForPunchInPunchOutReport(
        finalData,
        'PunchIn-OutReport',
        'xlsx',
        res
      );
      return;
    }

    return res.json({
      status: 200,
      message: message.usermessage.attendancedata,
      data: attendance_data.rows,
      totalcount: attendance_data.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.branchwiseattendancereport = async (req, res, next) => {
  try {
    let { page, limit, companyMasterID, userMasterID, FromDate, ToDate } =
      await req.body;
    let offset = (page - 1) * limit;
    let data;
    let usermaster;
    let userid = [];
    let totalcount;

    if (page == '' && limit == '') {
      if (userMasterID) {
        data = await attendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          include: {
            model: userMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          order: [['AttendanceDate', 'DESC']],
        });

        totalcount = await attendanceTransaction.count({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          include: {
            model: userMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        });
      } else {
        usermaster = await UserMaster.findAll({
          where: {
            companyMasterId: companyMasterID,
            status: 1,
          },
        });

        for (var i = 0; i < usermaster.length; i++) {
          userid.push(usermaster[i].userMasterID);
        }

        data = await attendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userid,
            },
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          include: {
            model: userMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          order: [['AttendanceDate', 'DESC']],
        });

        totalcount = await attendanceTransaction.count({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userid,
            },
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          include: {
            model: userMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        });
      }
    } else {
      if (userMasterID) {
        data = await attendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          include: {
            model: userMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          order: [['AttendanceDate', 'DESC']],
          limit: limit,
          offset: offset,
        });

        totalcount = await attendanceTransaction.count({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          include: {
            model: userMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        });
      } else {
        usermaster = await UserMaster.findAll({
          where: {
            companyMasterId: companyMasterID,
            status: 1,
          },
        });

        for (var i = 0; i < usermaster.length; i++) {
          userid.push(usermaster[i].userMasterID);
        }

        data = await attendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userid,
            },
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          include: {
            model: userMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          order: [['AttendanceDate', 'DESC']],
          limit: limit,
          offset: offset,
        });

        totalcount = await attendanceTransaction.count({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userid,
            },
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          include: {
            model: userMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        });
      }
    }
    for (var j = 0; j < data.length; j++) {
      let userdetails = await UserMaster.findOne({
        where: {
          userMasterID: data[j].userMasterID,
        },
      });

      data[j].dataValues.displayName = userdetails.dataValues.displayName;
      data[j].dataValues.userNumber = userdetails.dataValues.userNumber;

      if (data[j].Shift) {
        let shift = await shiftModel.findOne({
          where: {
            shiftID: data[j].Shift,
          },
        });

        data[j].dataValues.shiftName = shift.dataValues.shiftName;
      } else {
        data[j].dataValues.shiftName = '';
      }
    }

    return res.json({
      status: 200,
      message: 'Data Get Successfully.',
      data: data,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.dashboardpunchinout = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      date,
      branchMasterID,
      departmentID,
      designationID,
      divisionId,
      workingAreaId,
    } = await req.body;
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const total_active_user = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        status: 1,
      },
      include: [
        {
          model: EmployeeDesignation,
          where: {
            status: 1,
            ...(designationID &&
              (!Array.isArray(designationID) || designationID.length) && {
                designationID,
              }),
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: designationID && designationID.length ? true : false,
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
            ...(departmentID &&
              (!Array.isArray(departmentID) || departmentID.length) && {
                departmentID,
              }),
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: departmentID && departmentID.length ? true : false,
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
            ...(branchMasterID &&
              (!Array.isArray(branchMasterID) || branchMasterID.length) && {
                branchID: branchMasterID,
              }),
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: branchMasterID && branchMasterID.length ? true : false,
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
          model: attendanceTransaction,
          where: {
            AttendanceDate: date ? date : currentDate,
          },
          attributes: [
            'AttendanceTransID',
            'InDatetime',
            'OutDateTime',
            'AttendanceDate',
            'userMasterID',
            'Shifthrs',
            'ShiftIntime',
            'ShiftoutTime',
            'InHrs',
            'LateBy',
            'EarlyBy',
          ],
        },
        {
          model: EmployeeDivision,
          where: {
            status: 1,
            ...(divisionId &&
              (!Array.isArray(divisionId) || divisionId.length) && {
                divisionId,
              }),
            startDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: divisionId && divisionId.length ? true : false,
          attributes: ['divisionId'],
          include: [
            {
              model: Division,
              attributes: ['divisionName'],
            },
          ],
        },
        {
          model: EmployeeWorkingArea,
          where: {
            status: 1,
            ...(workingAreaId &&
              (!Array.isArray(workingAreaId) || workingAreaId.length) && {
                workingAreaId,
              }),
            startDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: workingAreaId && workingAreaId.length ? true : false,
          attributes: ['workingAreaId'],
          include: [
            {
              model: WorkingArea,
              attributes: ['workingAreaName'],
            },
          ],
        },
      ],
    });
    const filterPunchinUser = total_active_user.filter(
      (e) =>
        e.attendanceTransactions.length &&
        e.attendanceTransactions[0].InDatetime &&
        e.attendanceTransactions[0].OutDateTime == null
    );
    const filterPunchOutUser = total_active_user.filter(
      (e) =>
        e.attendanceTransactions.length &&
        e.attendanceTransactions[0].InDatetime &&
        e.attendanceTransactions[0].OutDateTime
    );
    const filterNotPunchUser = total_active_user.filter(
      (e) => e.attendanceTransactions.length == 0
    );

    const finaldata = [
      {
        total_active: total_active_user.length,
        total_punchin: filterPunchinUser.length,
        total_not_punchin: filterNotPunchUser.length,
        total_punchout: filterPunchOutUser.length,
      },
    ];

    return res.status(200).json({ status: 200, data: finaldata });
  } catch (err) {
    next(err);
  }
};

exports.getcalenderdatamonthwise = async (req, res, next) => {
  try {
    let {
      userMasterID,
      calendarstartdate,
      calendarenddate,
      userid,
      exportData,
    } = await req.body;
    userid = userMasterID ? userMasterID : userid;
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    let yearMonth = calendarstartdate.replace(/-/g, '').slice(0, 6);

    if (!userid || !calendarstartdate || !calendarenddate)
      return res.status(200).json({
        status: 401,
        message: 'Invalid parameters!',
        data: [],
      });

    const finalAttendanceData = [];
    let monthStartDate = new Date(calendarstartdate);
    let monthEndDate = new Date(calendarenddate);

    const [userData, employeeAttendancePolicies, userShiftRoster] =
      await Promise.all([
        // Get User Data
        UserMaster.findOne({
          where: {
            userMasterID: userMasterID,
            status: 1,
          },
          include: [
            // Employee Joining Details
            { required: true, model: EmployeeJoiningDetails },
            // Employee Branch
            {
              required: false,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(currentdate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: {
                      [Sequelize.Op.gte]: new Date(currentdate),
                    },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            // Attendance Transaction
            {
              required: false,
              separate: true,
              model: attendanceTransaction,
              where: {
                AttendanceDate: {
                  [Sequelize.Op.between]: [calendarstartdate, calendarenddate],
                },
              },
              include: [
                {
                  separate: true,
                  required: false,
                  model: overTimeCalculation,
                },
                {
                  model: shiftModel,
                  attributes: ['shiftName', 'shiftID'],
                  include: [{ model: shiftTime }],
                },
                {
                  separate: true,
                  required: false,
                  model: UserShortLeave,
                  where: {
                    authorizationStatus: 3,
                  },
                },
              ],

              order: [['AttendanceDate', 'ASC']],
            },
            // User Leave
            {
              required: false,
              model: UserLeave,
              where: {
                status: 1,
                authorizationStatus: {
                  [Sequelize.Op.ne]: 4,
                },

                [Sequelize.Op.or]: [
                  {
                    FromDate: {
                      [Sequelize.Op.lte]: calendarstartdate,
                    },
                    ToDate: {
                      [Sequelize.Op.gte]: calendarstartdate,
                    },
                  },
                  {
                    FromDate: {
                      [Sequelize.Op.lte]: calendarenddate,
                    },
                    ToDate: {
                      [Sequelize.Op.gte]: calendarenddate,
                    },
                  },
                  {
                    FromDate: {
                      [Sequelize.Op.gte]: calendarstartdate,
                    },
                    ToDate: {
                      [Sequelize.Op.lte]: calendarenddate,
                    },
                  },
                ],
              },
              include: [
                {
                  separate: true,
                  required: false,
                  model: UserLeaveTransaction,
                  where: {
                    status: 1,
                  },
                  include: [
                    {
                      model: hrLeaveTypes,
                      include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
                    },
                  ],
                },
                {
                  required: true,
                  model: hrLeaveTypes,
                  attributes: ['LeaveID'],
                },
              ],
            },
            // Hr Leave Monthly Transaction
            {
              required: false,
              model: HrLeaveMonthlyTrans,
              where: {
                AttnYearMon: yearMonth,
                verified: 1,
              },
              order: [['LeaveTranId', 'Asc']],
            },
            // Employee Shift
            {
              required: false,
              model: EmployeeShift,
              where: {
                status: 1,
                [Sequelize.Op.or]: [
                  {
                    startDate: {
                      [Sequelize.Op.between]: [
                        calendarstartdate,
                        calendarenddate,
                      ],
                    },
                  },
                  {
                    endDate: {
                      [Sequelize.Op.between]: [
                        calendarstartdate,
                        calendarenddate,
                      ],
                    },
                  },
                  {
                    [Sequelize.Op.and]: [
                      { startDate: { [Sequelize.Op.lte]: calendarstartdate } },
                      {
                        [Sequelize.Op.or]: [
                          {
                            endDate: {
                              [Sequelize.Op.gte]: calendarenddate,
                            },
                          },
                          { endDate: { [Sequelize.Op.eq]: null } },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ],
          attributes: ['userMasterID', 'displayName', 'companyMasterId'],
        }),
        // Employee Attendance Policy
        EmployeeAttendancePolicy.findAll({
          where: {
            status: 1,
            userMasterID,
            [Sequelize.Op.or]: [
              {
                startDate: {
                  [Sequelize.Op.between]: [calendarstartdate, calendarenddate],
                },
              },
              {
                endDate: {
                  [Sequelize.Op.between]: [calendarstartdate, calendarenddate],
                },
              },
              {
                [Sequelize.Op.and]: [
                  { startDate: { [Sequelize.Op.lte]: calendarstartdate } },
                  {
                    [Sequelize.Op.or]: [
                      {
                        endDate: {
                          [Sequelize.Op.gte]: calendarenddate,
                        },
                      },
                      { endDate: { [Sequelize.Op.eq]: null } },
                    ],
                  },
                ],
              },
            ],
          },
          attributes: ['attendancePolicyID', 'status', 'endDate', 'startDate'],
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
              ],
            },
          ],
        }),

        // Shift Roster
        ShiftRoster.findAll({
          where: {
            userMasterID,
            shiftRosterDate: {
              [Sequelize.Op.between]: [calendarstartdate, calendarenddate],
            },
          },
          include: [
            {
              required: false,
              model: Shift,
              attributes: ['shiftID', 'shiftName'],
              include: [{ required: false, model: shiftTime }],
            },
          ],
        }),
      ]);

    if (!userData) {
      return res.status(200).json({
        status: 200,
        data: finalAttendanceData,
      });
    }

    // Attendance Data
    const attendanceTransactionData =
      userData.attendanceTransactions &&
      userData.attendanceTransactions.length > 0
        ? userData.attendanceTransactions
        : [];

    // User Leave Data
    const userleaveData =
      userData.userLeaves && userData.userLeaves.length > 0
        ? userData.userLeaves
        : [];

    // Attendace Verification Data
    const attVerifyData =
      userData.hrLeaveMonthlyTrans && userData.hrLeaveMonthlyTrans.length > 0
        ? userData.hrLeaveMonthlyTrans[0]
        : null;

    // Employee Joining
    const empJoining =
      userData.employeeJoiningDetails &&
      userData.employeeJoiningDetails.length > 0
        ? userData.employeeJoiningDetails[0]
        : null;

    // Employee Branch
    const branch =
      (userData.employeeBranches && userData.employeeBranches.length) > 0
        ? userData.employeeBranches[0].branchMaster
          ? userData.employeeBranches[0].branchMaster.branchName
          : ''
        : '';

    // Employee Shift
    const userShiftData =
      userData.employeeShifts && userData.employeeShifts.length > 0
        ? userData.employeeShifts
        : [];

    if (empJoining) {
      // Employee Joining Date
      const EmployeeJoiningDate = empJoining.joiningDate
        ? new Date(empJoining.joiningDate)
        : null;

      if (EmployeeJoiningDate > monthStartDate) {
        monthStartDate = EmployeeJoiningDate;
      }

      // Leaving date
      const EmployeeLeaveingDate = empJoining.leavingDate
        ? new Date(empJoining.leavingDate)
        : null;
      if (EmployeeLeaveingDate) {
        if (EmployeeLeaveingDate < monthEndDate) {
          monthEndDate = EmployeeLeaveingDate;
        }
      }

      const user_attendancePolicy =
        employeeAttendancePolicies?.[0]?.attendancePolicy || null;

      const weekOffHolidayPriority =
        user_attendancePolicy?.WHPHPriority || null;

      const typeCondition =
        weekOffHolidayPriority === 'PH' ? "'holiday'" : "'weekoff'";

      const weekholidaydata = await weekoffHolidayTran.findAll({
        where: {
          userMasterID: userMasterID,
          date: {
            [Sequelize.Op.between]: [
              new Date(monthStartDate).toISOString().slice(0, 10),
              new Date(monthEndDate).toISOString().slice(0, 10),
            ],
          },
          [Sequelize.Op.and]: Sequelize.literal(`(date, "tableName") IN (
            SELECT date, 
                   CASE 
                     WHEN SUM(CASE WHEN "tableName" = 'weekoff' THEN 1 ELSE 0 END) > 0 
                          AND SUM(CASE WHEN "tableName" = 'holiday' THEN 1 ELSE 0 END) > 0 
                     THEN MAX(CASE WHEN "tableName" = ${typeCondition} THEN "tableName" END)
                     ELSE MAX("tableName") 
                   END AS selected_tableName
            FROM "weekoffHolidayTrans"
            WHERE "userMasterID" = ${userMasterID}
              AND date BETWEEN '${new Date(monthStartDate).toISOString().slice(0, 10)}' AND '${new Date(monthEndDate).toISOString().slice(0, 10)}'
              AND ("optionalHoliday" IS FALSE OR "optionalHoliday" IS NULL)
            GROUP BY date
          )`),
        },
        order: [
          ['date', 'ASC'],
          ['tableName', 'DESC'],
        ],
      });

      const finalweekoffholidaysData = await toGetFinalHolidayWeekoff(
        attendanceTransactionData,
        user_attendancePolicy,
        weekholidaydata,
        [...userleaveData].flatMap((e) => e.userLeaveTransactions),
        new Date(monthStartDate).toISOString().slice(0, 10),
        new Date(monthEndDate).toISOString().slice(0, 10),
        userMasterID
      );

      const finalweekoffholidays = [
        ...finalweekoffholidaysData.weekoffs,
        ...finalweekoffholidaysData.holidays,
      ];

      const weekoffDataToPush = (date, title) => {
        return {
          EmployeeCode: empJoining.employeeCode,
          userMasterId: userid,
          inTime: '',
          outTime: '',
          userName: userData.displayName,
          companyMasterId: userData.companyMasterId,
          attendanceTransactionId: '',
          date,
          shift: '',
          shiftHours: '',
          shiftInTime: '',
          shiftOutTime: '',
          inHours: '',
          outHours: '',
          lateBy: '',
          earlyBy: '',
          penalty: '',
          penaltyDeduction: '',
          goEarlyUsed: '',
          goEarlyPanalty: '',
          goEarlyPanaltyDeduction: '',
          attVerifyData: attVerifyData ? 1 : 0,
          shiftName: '',
          title,
          branchName: branch,
          otStatus: '',
          otAmount: '',
          breakStartTime1: '',
          breakEndTime1: '',
          breakMinutes1: '',
          breakStartTime2: '',
          breakEndTime2: '',
          breakMinutes2: '',
          roundOffMinutes: '',
          isShift: false,
          remarks: '',
          withoutOtMinutes: '',
          addPenaltyFlag: false,
          LCPenaltyFrom: '',
          EGPenaltyFrom: '',
        };
      };

      while (monthStartDate <= monthEndDate) {
        const dt = monthStartDate.toISOString().slice(0, 10);
        const userleaveDateWise = userleaveData.filter((leave) => {
          return (
            new Date(leave.FromDate) <= new Date(dt) &&
            new Date(leave.ToDate) >= new Date(dt)
          );
        });

        // Pending Leave
        const userLeaveRequest = userleaveDateWise
          ? userleaveDateWise.find(
              (e) =>
                e.authorizationStatus == 0 ||
                e.authorizationStatus == 1 ||
                e.authorizationStatus == 2
            )
          : null;

        // Approved Leave
        const approveLeave = [];

        if (userleaveDateWise && userleaveDateWise.length > 0) {
          for (const leave of userleaveDateWise) {
            for (const leavetrans of leave.userLeaveTransactions) {
              if (
                new Date(leavetrans.date).getTime() == new Date(dt).getTime() &&
                leavetrans.status == 1
              )
                approveLeave.push(leavetrans);
            }
          }
        }

        // weekoff data
        const weekOffData =
          weekholidaydata && weekholidaydata.length > 0
            ? weekholidaydata.find((att) => {
                return new Date(att.date).getTime() === new Date(dt).getTime();
              })
            : null;

        // Date Wise Shift Roster
        const userDatewiseRoster =
          userShiftRoster && userShiftRoster.length > 0
            ? userShiftRoster.find((att) => {
                return (
                  new Date(att.shiftRosterDate).getTime() ===
                  new Date(dt).getTime()
                );
              })
            : null;

        // Date Wise Shift
        const userDateWiseShift =
          userShiftData && userShiftData.length > 0
            ? userShiftData.find(
                (e) =>
                  e.startDate <= dt && (e.endDate >= dt || e.endDate == null)
              )
            : null;

        const attendanceData =
          dt <= currentdate
            ? attendanceTransactionData.find((att) => {
                return att.AttendanceDate == dt;
              })
            : null;

        if (dt <= currentdate) {
          if (attendanceData) {
            const overtimeData =
              attendanceData.OverTimeCalculations &&
              attendanceData.OverTimeCalculations.length > 0 &&
              attendanceData.OverTimeCalculations[0].AuthorizationRequired != 4
                ? attendanceData.OverTimeCalculations[0]
                : null;

            // user Short leave
            const userShortLeave = attendanceData.userShortLeaves?.[0] || null;

            const remarks = attendanceData.remarks || null;

            let otStatus = '';
            let otAmount = '';

            if (overtimeData) {
              if (overtimeData.AuthorizationRequired == 3)
                (otStatus = 'Accept'),
                  (otAmount = +overtimeData.UpdateOverTimeHourAndMin);
              else
                (otStatus = 'Pending'),
                  (otAmount = +overtimeData.OverTimeHourAndMin);
            }

            // Check Shift
            const userShift = attendanceData.shift;

            let tempTitle =
              attendanceData.fulldayhalfday == 1
                ? 'Present'
                : attendanceData.fulldayhalfday == 0.5
                  ? 'Half Day'
                  : attendanceData.fulldayhalfday == 0
                    ? 'Absent'
                    : currentdate == attendanceData.AttendanceDate
                      ? 'Present'
                      : 'Absent';

            if (
              !attendanceData.OutDateTime &&
              currentdate != attendanceData.AttendanceDate
            )
              tempTitle = 'Miss Punch';

            const addPenaltyFlag =
              tempTitle == 'Present' || tempTitle == 'Half Day' ? true : false;

            // if present or half day and user short leave is available
            if (
              (tempTitle == 'Present' || tempTitle == 'Half Day') &&
              userShortLeave
            )
              tempTitle += ',SHL';

            if (attendanceData.latePenaltyMinutes)
              tempTitle = tempTitle + '+LC';
            if (attendanceData.earlyPenaltyMinutes)
              tempTitle = tempTitle + '+EG';

            if (attendanceData.PanaltyDeduction) tempTitle = tempTitle + '+LC';
            if (attendanceData.goEarlyPanaltyDeduction)
              tempTitle = tempTitle + '+EG';

            finalAttendanceData.push({
              EmployeeCode: empJoining.employeeCode,
              userMasterId: attendanceData.userMasterID,
              inTime: attendanceData.InDatetime,
              outTime: attendanceData.OutDateTime,
              userName: userData.displayName,
              companyMasterId: userData.companyMasterId,
              attendanceTransactionId: attendanceData.AttendanceTransID,
              date: attendanceData.AttendanceDate,
              shift: attendanceData.Shift,
              shiftHours: attendanceData.Shifthrs,
              shiftInTime: attendanceData.ShiftIntime,
              shiftOutTime: attendanceData.ShiftoutTime,
              inHours: attendanceData.InHrs,
              outHours: attendanceData.OutHrs,
              lateBy: attendanceData.LateBy,
              earlyBy: attendanceData.EarlyBy,
              penalty: attendanceData.Panalty,
              penaltyDeduction: attendanceData.PanaltyDeduction,
              goEarlyUsed: attendanceData.goEarlyUsed,
              goEarlyPanalty: attendanceData.goEarlyPanalty,
              goEarlyPanaltyDeduction: attendanceData.goEarlyPanaltyDeduction,
              attVerifyData: attVerifyData ? 1 : 0,
              shiftName: userShift ? userShift.shiftName : ' ',
              title: tempTitle,
              branchName: branch,
              otStatus: otStatus,
              otAmount: otAmount,
              breakStartTime1: attendanceData.lunchBreakStartTime,
              breakEndTime1: attendanceData.lunchBreakEndTime,
              breakMinutes1: attendanceData.lunchBreak,
              breakStartTime2: attendanceData.teaBreakInStartTime,
              breakEndTime2: attendanceData.teaBreakEndTime,
              breakMinutes2: attendanceData.teaBreak,
              roundOffMinutes: attendanceData.roundOffMinutes,
              isShift: false,
              remarks,
              withoutOtMinutes: attendanceData.withoutOtMinutes,
              addPenaltyFlag,
              LCPenaltyFrom: attendanceData.LCPenaltyFrom,
              EGPenaltyFrom: attendanceData.EGPenaltyFrom,
            });

            if (userLeaveRequest) {
              finalAttendanceData.push({
                EmployeeCode: empJoining.employeeCode,
                userMasterId: userid,
                inTime: '',
                outTime: '',
                userName: userData.displayName,
                companyMasterId: userData.companyMasterId,
                attendanceTransactionId: '',
                date: dt,
                shift: '',
                shiftHours: '',
                shiftInTime: '',
                shiftOutTime: '',
                inHours: '',
                outHours: '',
                lateBy: '',
                earlyBy: '',
                penalty: '',
                penaltyDeduction: '',
                goEarlyUsed: '',
                goEarlyPanalty: '',
                goEarlyPanaltyDeduction: '',
                attVerifyData: attVerifyData ? 1 : 0,
                shiftName: '',
                branchName: branch,
                title:
                  userLeaveRequest.hrLeaveType.LeaveID == 25
                    ? 'OD Applied'
                    : 'Leave',
                otStatus: '',
                otAmount: '',
                breakStartTime1: '',
                breakEndTime1: '',
                breakMinutes1: '',
                breakStartTime2: '',
                breakEndTime2: '',
                breakMinutes2: '',
                roundOffMinutes: '',
                isShift: false,
                remarks: '',
                withoutOtMinutes: '',
                addPenaltyFlag: false,
                LCPenaltyFrom: '',
                EGPenaltyFrom: '',
              });
            } else {
              if (approveLeave.length > 0) {
                for (let i = 0; i < approveLeave.length; i++) {
                  finalAttendanceData.push({
                    EmployeeCode: empJoining.employeeCode,
                    userMasterId: userid,
                    inTime: '',
                    outTime: '',
                    userName: userData.displayName,
                    companyMasterId: userData.companyMasterId,
                    attendanceTransactionId: '',
                    date: dt,
                    shift: '',
                    shiftHours: '',
                    shiftInTime: '',
                    shiftOutTime: '',
                    inHours: '',
                    outHours: '',
                    lateBy: '',
                    earlyBy: '',
                    penalty: '',
                    penaltyDeduction: '',
                    goEarlyUsed: '',
                    goEarlyPanalty: '',
                    goEarlyPanaltyDeduction: '',

                    attVerifyData: attVerifyData ? 1 : 0,
                    shiftName: '',
                    title:
                      approveLeave[i].hrLeaveType.LeaveID == 25
                        ? 'OD'
                        : approveLeave[i].hrLeaveType.LeaveMaster.LeaveName,
                    branchName: branch,
                    otStatus: '',
                    otAmount: '',
                    breakStartTime1: '',
                    breakEndTime1: '',
                    breakMinutes1: '',
                    breakStartTime2: '',
                    breakEndTime2: '',
                    breakMinutes2: '',
                    roundOffMinutes: '',
                    isShift: false,
                    remarks: '',
                    withoutOtMinutes: '',
                    addPenaltyFlag: false,
                    LCPenaltyFrom: '',
                    EGPenaltyFrom: '',
                  });
                }
              }
            }

            if (weekOffData) {
              const title = weekOffData.optionalHoliday
                ? 'Optional Holiday'
                : weekOffData.tableName === 'weekoff'
                  ? 'WeekOff'
                  : 'Holiday';

              finalAttendanceData.push(weekoffDataToPush(dt, title));

              const sandwich = finalweekoffholidays.find(
                (e) =>
                  new Date(e.date).getTime() ==
                  new Date(weekOffData.date).getTime()
              );
              if (!sandwich && weekOffData.date < currentdate) {
                const title = 'Absent(S)';
                finalAttendanceData.push(weekoffDataToPush(dt, title));
              }
            }
          } else {
            // Leave Request
            if (userLeaveRequest) {
              finalAttendanceData.push({
                EmployeeCode: empJoining.employeeCode,
                userMasterId: userid,
                inTime: '',
                outTime: '',
                userName: userData.displayName,
                companyMasterId: userData.companyMasterId,
                attendanceTransactionId: '',
                date: dt,
                shift: '',
                shiftHours: '',
                shiftInTime: '',
                shiftOutTime: '',
                inHours: '',
                outHours: '',
                lateBy: '',
                earlyBy: '',
                penalty: '',
                penaltyDeduction: '',
                goEarlyUsed: '',
                goEarlyPanalty: '',
                goEarlyPanaltyDeduction: '',
                attVerifyData: attVerifyData ? 1 : 0,
                shiftName: '',
                title:
                  userLeaveRequest.hrLeaveType.LeaveID == 25
                    ? 'OD Applied'
                    : 'Leave',
                branchName: branch,
                otStatus: '',
                otAmount: '',
                breakStartTime1: '',
                breakEndTime1: '',
                breakMinutes1: '',
                breakStartTime2: '',
                breakEndTime2: '',
                breakMinutes2: '',
                roundOffMinutes: '',
                isShift: false,
                remarks: '',
                withoutOtMinutes: '',
                addPenaltyFlag: false,
                LCPenaltyFrom: '',
                EGPenaltyFrom: '',
              });

              if (weekOffData) {
                // if half day approved leave
                if (
                  +userLeaveRequest?.LeaveDays <= 0.5 &&
                  weekOffData.value == 0.5
                ) {
                  const title = weekOffData.optionalHoliday
                    ? 'Optional Holiday'
                    : weekOffData.tableName === 'weekoff'
                      ? 'WeekOff'
                      : 'Holiday';

                  finalAttendanceData.push(weekoffDataToPush(dt, title));

                  const sandwich = finalweekoffholidays.find(
                    (e) =>
                      new Date(e.date).getTime() ==
                      new Date(weekOffData.date).getTime()
                  );
                  if (!sandwich && weekOffData.date < currentdate) {
                    const title = 'Absent(S)';
                    finalAttendanceData.push(weekoffDataToPush(dt, title));
                  }
                }
              }
            } else {
              if (approveLeave.length > 0) {
                for (let i = 0; i < approveLeave.length; i++) {
                  finalAttendanceData.push({
                    EmployeeCode: empJoining.employeeCode,
                    userMasterId: userid,
                    inTime: '',
                    outTime: '',
                    userName: userData.displayName,
                    companyMasterId: userData.companyMasterId,
                    attendanceTransactionId: '',
                    date: dt,
                    shift: '',
                    shiftHours: '',
                    shiftInTime: '',
                    shiftOutTime: '',
                    inHours: '',
                    outHours: '',
                    lateBy: '',
                    earlyBy: '',
                    penalty: '',
                    penaltyDeduction: '',
                    goEarlyUsed: '',
                    goEarlyPanalty: '',
                    goEarlyPanaltyDeduction: '',

                    attVerifyData: attVerifyData ? 1 : 0,
                    shiftName: '',
                    title:
                      approveLeave[i].hrLeaveType.LeaveID == 25
                        ? 'OD'
                        : approveLeave[i].hrLeaveType.LeaveMaster.LeaveName,
                    branchName: branch,
                    otStatus: '',
                    otAmount: '',
                    breakStartTime1: '',
                    breakEndTime1: '',
                    breakMinutes1: '',
                    breakStartTime2: '',
                    breakEndTime2: '',
                    breakMinutes2: '',
                    roundOffMinutes: '',
                    isShift: false,
                    remarks: '',
                    withoutOtMinutes: '',
                    addPenaltyFlag: false,
                    LCPenaltyFrom: '',
                    EGPenaltyFrom: '',
                  });
                }

                if (weekOffData) {
                  // if half day approved leave
                  if (
                    +approveLeave.reduce((acc, obj) => acc + +obj.days, 0) <=
                      0.5 &&
                    weekOffData.value == 0.5
                  ) {
                    const title = weekOffData.optionalHoliday
                      ? 'Optional Holiday'
                      : weekOffData.tableName === 'weekoff'
                        ? 'WeekOff'
                        : 'Holiday';

                    finalAttendanceData.push(weekoffDataToPush(dt, title));

                    const sandwich = finalweekoffholidays.find(
                      (e) =>
                        new Date(e.date).getTime() ==
                        new Date(weekOffData.date).getTime()
                    );
                    if (!sandwich && weekOffData.date < currentdate) {
                      const title = 'Absent(S)';
                      finalAttendanceData.push(weekoffDataToPush(dt, title));
                    }
                  }
                }
              } else {
                if (weekOffData) {
                  const title = weekOffData.optionalHoliday
                    ? 'Optional Holiday'
                    : weekOffData.tableName === 'weekoff'
                      ? 'WeekOff'
                      : 'Holiday';

                  finalAttendanceData.push(weekoffDataToPush(dt, title));

                  const sandwich = finalweekoffholidays.find(
                    (e) =>
                      new Date(e.date).getTime() ==
                      new Date(weekOffData.date).getTime()
                  );
                  if (!sandwich && weekOffData.date < currentdate) {
                    const title = 'Absent(S)';
                    finalAttendanceData.push(weekoffDataToPush(dt, title));
                  }
                } else {
                  // if Absent

                  finalAttendanceData.push({
                    EmployeeCode: empJoining.employeeCode,
                    userMasterId: userid,
                    inTime: '',
                    outTime: '',
                    userName: userData.displayName,
                    companyMasterId: userData.companyMasterId,
                    attendanceTransactionId: '',
                    date: dt,
                    shift: '',
                    shiftHours: '',
                    shiftInTime: '',
                    shiftOutTime: '',
                    inHours: '',
                    outHours: '',
                    lateBy: '',
                    earlyBy: '',
                    penalty: '',
                    penaltyDeduction: '',
                    goEarlyUsed: '',
                    goEarlyPanalty: '',
                    goEarlyPanaltyDeduction: '',

                    attVerifyData: attVerifyData ? 1 : 0,
                    shiftName: '',
                    title: 'Absent',
                    branchName: branch,
                    otStatus: '',
                    otAmount: '',
                    breakStartTime1: '',
                    breakEndTime1: '',
                    breakMinutes1: '',
                    breakStartTime2: '',
                    breakEndTime2: '',
                    breakMinutes2: '',
                    roundOffMinutes: '',
                    isShift: false,
                    remarks: '',
                    withoutOtMinutes: '',
                    addPenaltyFlag: false,
                    LCPenaltyFrom: '',
                    EGPenaltyFrom: '',
                  });
                }
              }
            }
          }
        } else {
          // Leave Request
          if (userLeaveRequest) {
            finalAttendanceData.push({
              EmployeeCode: empJoining.employeeCode,
              userMasterId: userid,
              inTime: '',
              outTime: '',
              userName: userData.displayName,
              companyMasterId: userData.companyMasterId,
              attendanceTransactionId: '',
              date: dt,
              shift: '',
              shiftHours: '',
              shiftInTime: '',
              shiftOutTime: '',
              inHours: '',
              outHours: '',
              lateBy: '',
              earlyBy: '',
              penalty: '',
              penaltyDeduction: '',
              goEarlyUsed: '',
              goEarlyPanalty: '',
              goEarlyPanaltyDeduction: '',

              attVerifyData: attVerifyData ? 1 : 0,
              shiftName: '',
              branchName: branch,
              title:
                userLeaveRequest.hrLeaveType.LeaveID == 25
                  ? 'OD Applied'
                  : 'Leave',

              otStatus: '',
              otAmount: '',
              breakStartTime1: '',
              breakEndTime1: '',
              breakMinutes1: '',
              breakStartTime2: '',
              breakEndTime2: '',
              breakMinutes2: '',
              roundOffMinutes: '',
              isShift: false,
              remarks: '',
              withoutOtMinutes: '',
              addPenaltyFlag: false,
              LCPenaltyFrom: '',
              EGPenaltyFrom: '',
            });
          } else {
            if (approveLeave.length > 0) {
              for (let i = 0; i < approveLeave.length; i++) {
                finalAttendanceData.push({
                  EmployeeCode: empJoining.employeeCode,
                  userMasterId: userid,
                  inTime: '',
                  outTime: '',
                  userName: userData.displayName,
                  companyMasterId: userData.companyMasterId,
                  attendanceTransactionId: '',
                  date: dt,
                  shift: '',
                  shiftHours: '',
                  shiftInTime: '',
                  shiftOutTime: '',
                  inHours: '',
                  outHours: '',
                  lateBy: '',
                  earlyBy: '',
                  penalty: '',
                  penaltyDeduction: '',
                  goEarlyUsed: '',
                  goEarlyPanalty: '',
                  goEarlyPanaltyDeduction: '',

                  attVerifyData: attVerifyData ? 1 : 0,
                  shiftName: '',
                  title:
                    approveLeave[i].hrLeaveType.LeaveID == 25
                      ? 'OD'
                      : approveLeave[i].hrLeaveType.LeaveMaster.LeaveName,
                  branchName: branch,
                  otStatus: '',
                  otAmount: '',
                  breakStartTime1: '',
                  breakEndTime1: '',
                  breakMinutes1: '',
                  breakStartTime2: '',
                  breakEndTime2: '',
                  breakMinutes2: '',
                  roundOffMinutes: '',
                  isShift: false,
                  remarks: '',
                  withoutOtMinutes: '',
                  addPenaltyFlag: false,
                  LCPenaltyFrom: '',
                  EGPenaltyFrom: '',
                });
              }
            } else {
              if (weekOffData) {
                const title = weekOffData.optionalHoliday
                  ? 'Optional Holiday'
                  : weekOffData.tableName === 'weekoff'
                    ? 'WeekOff'
                    : 'Holiday';

                finalAttendanceData.push(weekoffDataToPush(dt, title));
              }
            }
          }
        }
        const curr_dt = new Date(dt);
        // Date Wise Shift
        const userDateAttendacePolicy =
          employeeAttendancePolicies && employeeAttendancePolicies.length > 0
            ? employeeAttendancePolicies.find(
                (e) =>
                  e.startDate <= curr_dt &&
                  (e.endDate >= curr_dt || e.endDate == null)
              )
            : null;

        const getShowShift =
          userDateAttendacePolicy && userDateAttendacePolicy.attendancePolicy
            ? userDateAttendacePolicy.attendancePolicy.showShift
            : false;
        if (getShowShift) {
          if (attendanceData || userDatewiseRoster || userDateWiseShift) {
            const shift = await Shift.findAll({
              where: {
                companyMasterID: +userData.companyMasterId,
                status: 1,
              },
              include: [
                {
                  model: shiftTime,
                },
              ],
            });
            let empDayShift;
            let shiftID;
            if (attendanceData) {
              empDayShift = attendanceData.shift;
              shiftID = [attendanceData.Shift];
            } else if (userDatewiseRoster) {
              empDayShift = userDatewiseRoster.shift;
              shiftID = [userDatewiseRoster.shiftID];
            } else if (userDateWiseShift) {
              if (userDateWiseShift.shiftID) {
                empDayShift = shift.filter(
                  (e) => e.shiftID == userDateWiseShift.shiftID
                );
                shiftID = [userDateWiseShift.shiftID];
              } else if (
                userDateWiseShift.shiftsID &&
                userDateWiseShift.shiftsID.length > 0
              ) {
                empDayShift = shift.filter((e) =>
                  userDateWiseShift.shiftsID.includes(e.shiftID.toString())
                );
                shiftID = userDateWiseShift.shiftsID;
              }
            }
            const empDayShiftIDs = Array.isArray(shiftID)
              ? shift.filter((e) =>
                  shiftID.map(String).includes(String(e.shiftID))
                )
              : shift.filter((e) => String(e.shiftID) === String(shiftID));
            finalAttendanceData.push({
              EmployeeCode: empJoining.employeeCode,
              userMasterId: attendanceData
                ? attendanceData.userMasterID
                : userid,
              inTime: attendanceData ? attendanceData.InDatetime : '',
              outTime: attendanceData ? attendanceData.OutDateTime : '',
              userName: userData.displayName,
              companyMasterId: userData.companyMasterId,
              attendanceTransactionId: attendanceData
                ? attendanceData.AttendanceTransID
                : '',
              date: attendanceData ? attendanceData.AttendanceDate : dt,
              shift: attendanceData
                ? attendanceData.Shift
                : userDatewiseRoster
                  ? userDatewiseRoster.shiftID.toString()
                  : '',
              shiftHours: attendanceData ? attendanceData.Shifthrs : '',
              shiftInTime: attendanceData ? attendanceData.ShiftIntime : '',
              shiftOutTime: attendanceData ? attendanceData.ShiftoutTime : '',
              inHours: attendanceData ? attendanceData.InHrs : '',
              outHours: attendanceData ? attendanceData.OutHrs : '',
              lateBy: attendanceData ? attendanceData.LateBy : '',
              earlyBy: attendanceData ? attendanceData.EarlyBy : '',
              penalty: attendanceData ? attendanceData.Panalty : '',
              penaltyDeduction: attendanceData
                ? attendanceData.PanaltyDeduction
                : '',
              goEarlyUsed: attendanceData ? attendanceData.goEarlyUsed : '',
              goEarlyPanalty: attendanceData
                ? attendanceData.goEarlyPanalty
                : '',
              goEarlyPanaltyDeduction: attendanceData
                ? attendanceData.goEarlyPanaltyDeduction
                : '',
              attVerifyData: attVerifyData ? 1 : 0,
              shiftName: empDayShiftIDs.map((e) => e.shiftName).join(' ,'),
              title: empDayShiftIDs.map((e) => e.shiftName).join(','),
              branchName: branch,
              otStatus: '',
              otAmount: '',
              breakStartTime1: attendanceData
                ? attendanceData.lunchBreakStartTime
                : '',
              breakEndTime1: attendanceData
                ? attendanceData.lunchBreakEndTime
                : '',
              breakMinutes1: attendanceData ? attendanceData.lunchBreak : '',
              breakStartTime2: attendanceData
                ? attendanceData.teaBreakInStartTime
                : '',
              breakEndTime2: attendanceData
                ? attendanceData.teaBreakEndTime
                : '',
              breakMinutes2: attendanceData ? attendanceData.teaBreak : '',
              roundOffMinutes: attendanceData
                ? attendanceData.roundOffMinutes
                : '',
              isShift: true,
              remarks: attendanceData?.remarks || '',
              withoutOtMinutes: attendanceData?.withoutOtMinutes || '',
              addPenaltyFlag: false,
              LCPenaltyFrom: attendanceData?.LCPenaltyFrom || '',
              EGPenaltyFrom: attendanceData?.EGPenaltyFrom || '',
            });
          }
        }

        monthStartDate = new Date(
          monthStartDate.setDate(monthStartDate.getDate() + 1)
        );
      }
    }

    if (exportData) {
      const finaldata = finalAttendanceData.map((e) => {
        // if (!e.shift) {
        return {
          'Employee Code': e.EmployeeCode,
          'Employee Name': e.userName,
          'Branch Name': e.branchName,
          'Attendance Date': e.date,
          Status: e.title,
          InTime: e.inTime ? new Date(e.inTime).toLocaleString() : '',
          OutTime: e.outTime ? new Date(e.outTime).toLocaleString() : '',
          'Shift Name': e.shiftName,
          'Shift Hour': e.shiftHours,
          'Shift InTime': e.shiftInTime,
          'Shift OutTime': e.shiftOutTime,
          'In Minutes': e.inHours,
          'Out Minutes': e.outHours,
          'Working Minutes': e.roundOffMinutes,
          'WithOut OT Minutes': e.withoutOtMinutes,
          LateBy: e.lateBy,
          EarlyBy: e.earlyBy,
          Penalty: e.penalty,
          'Penalty Deduction By': e.penaltyDeduction,
          'GoEarly Penalty': e.goEarlyPanalty,
          'GoEarly Penalty Deduction By': e.goEarlyPanaltyDeduction,
          'Overtime Minutes': e.otAmount,
          'Overtime Status': e.otStatus,
          'Break-1 StartTime': e.breakStartTime1
            ? new Date(e.breakStartTime1).toLocaleString()
            : '',
          'Break-1 EndTime': e.breakEndTime1
            ? new Date(e.breakEndTime1).toLocaleString()
            : '',
          'Break-1 Minutes': e.breakMinutes1,
          'Break-2 StartTime': e.breakStartTime2
            ? new Date(e.breakStartTime2).toLocaleString()
            : '',
          'Break-2 EndTime': e.breakEndTime2
            ? new Date(e.breakEndTime2).toLocaleString()
            : '',
          'Break-2 Minutes': e.breakMinutes2,
          Remarks: e.remarks,
        };
        // }
      });

      return await generateExcel(finaldata, 'Attendance', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      data: finalAttendanceData,
    });
  } catch (err) {
    next(err);
  }
};

exports.shiftupdate = async (req, res, next) => {
  try {
    const {
      userMasterID,
      startdate,
      enddate,
      shiftID,
      shiftSelection,
      updateBy,
      updateByIp,
    } = req.body;
    const usermasterid = userMasterID;

    const createBy = updateBy;

    let updated_id = [];
    let attendanceVerifyUser = [];
    let notattendanceVerifyUser = [];

    let shiftTimeData = [];
    let shift;

    if (shiftSelection != 'auto' && shiftID) {
      shift = await shiftModel.findOne({
        where: {
          shiftID: shiftID,
        },
        include: [{ required: false, model: shiftTime }],
      });
    }

    const attendanceInclude = [
      {
        model: UserMaster,
        required: true,
        ...accessibleUsers(req.userDetails),
        attributes: ['userMasterID', 'companyMasterId'],
      },
      {
        required: false,
        model: UserShortLeave,
        where: {
          authorizationStatus: 3,
        },
      },
    ];

    if (shiftSelection == 'auto') {
      attendanceInclude.push({
        model: Shift,
        include: [{ required: false, separate: true, model: ShiftTIme }],
      });
    }

    const [
      allUserAttendanceData,
      allUserEmployeeSalaryPolicy,
      allUserEmployeeAttendancePolicy,
      allUserShiftRosterData,
      allUserShortLeavePolicy,
      allUserCoffData,
      allUserOTData,
      allUserExtraDaysData,
    ] = await Promise.all([
      // allUserAttendanceData
      attendanceTransaction.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: usermasterid,
          },
          AttendanceDate: {
            [Sequelize.Op.between]: [startdate, enddate],
          },
        },
        include: attendanceInclude,
        order: [['AttendanceDate', 'ASC']],
      }),
      // allUserEmployeeSalaryPolicy
      EmployeeSalaryPolicy.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: usermasterid,
          },
          status: 1,
          [Sequelize.Op.or]: [
            {
              startDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              endDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              startDate: {
                [Sequelize.Op.lte]: enddate,
              },
            },
          ],

          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              endDate: {
                [Sequelize.Op.gte]: enddate,
              },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        attributes: ['userMasterID', 'salaryPolicyID', 'startDate', 'endDate'],
        include: [{ model: SalaryPolicy, as: 'salaryPolicy' }],
      }),
      // allUserEmployeeAttendancePolicy
      EmployeeAttendancePolicy.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: usermasterid,
          },
          status: 1,
          [Sequelize.Op.or]: [
            {
              startDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              endDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              startDate: {
                [Sequelize.Op.lte]: enddate,
              },
            },
          ],

          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              endDate: {
                [Sequelize.Op.gte]: enddate,
              },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        attributes: [
          'userMasterID',
          'attendancePolicyID',
          'startDate',
          'endDate',
        ],
        include: [{ model: AttendancePolicy, as: 'attendancePolicy' }],
      }),
      // allUserShiftRosterData
      ShiftRoster.findAll({
        where: {
          shiftRosterDate: {
            [Sequelize.Op.between]: [startdate, enddate],
          },
          userMasterID: {
            [Sequelize.Op.in]: usermasterid,
          },
        },
      }),
      // allUserShortLeavePolicy
      EmployeeShortLeavePolicy.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: usermasterid,
          },
          status: 1,
          [Sequelize.Op.or]: [
            {
              applicableDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              endDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              applicableDate: {
                [Sequelize.Op.lte]: enddate,
              },
            },
          ],

          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.between]: [startdate, enddate],
              },
            },
            {
              endDate: {
                [Sequelize.Op.gte]: enddate,
              },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        attributes: [
          'userMasterID',
          'shortLeavePolicyID',
          'applicableDate',
          'endDate',
        ],
        include: [{ model: ShortLeave }],
      }),
      // allUserCoffData
      coffMaster.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: usermasterid,
          },
          LeaveCreatedDate: {
            [Sequelize.Op.between]: [startdate, enddate],
          },
          status: 1,
        },
        include: [{ model: CompensatoryOffAuthorization }],
      }),
      // allUserOTData
      overTimeCalculation.findAll({
        where: {
          UserMasterID: {
            [Sequelize.Op.in]: usermasterid,
          },
          OverTimeDate: {
            [Sequelize.Op.between]: [startdate, enddate],
          },
        },
      }),
      // allUserEXtraDaysData
      ExtraDays.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: usermasterid,
          },
          date: {
            [Sequelize.Op.between]: [startdate, enddate],
          },
        },
        include: [{ model: ExtraDaysAuthorization }],
      }),
    ]);

    // const findMissingDates = (dates, userShiftRoster) => {
    //   // Extract dates from userShiftRoster into a Set for quick lookup
    //   const rosterDates = new Set(
    //     userShiftRoster.map((roster) => roster.shiftRosterDate)
    //   );

    //   // Filter dates to find ones not in userShiftRoster
    //   return dates.filter((date) => !rosterDates.has(date));
    // };

    const AllUserAttendanceVerify = await HrLeaveMonthlyTrans.findAll({
      where: {
        userMasterID: usermasterid,
        [Sequelize.Op.or]: [
          {
            // attendance calculation start within the date range
            monthstartdate: { [Sequelize.Op.between]: [startdate, enddate] },
          },
          {
            // attendance calculation ends within the date range
            monthenddate: { [Sequelize.Op.between]: [startdate, enddate] },
          },
          {
            // attendance calculation spans the entire date range
            monthstartdate: { [Sequelize.Op.gte]: startdate },
            monthenddate: { [Sequelize.Op.lte]: enddate },
          },
        ],
        verified: 1,
      },
    });

    const formatdatesArray = await getDatesFromDateRange(
      new Date(startdate),
      new Date(enddate)
    );

    const datesArray = formatdatesArray.map((e) =>
      e.toISOString().slice(0, 10)
    );

    const addShiftRosterData = [];

    for (const user of usermasterid) {
      const attendancedata = allUserAttendanceData.filter(
        (e) => e.userMasterID == user
      );

      const attendanceVerify = AllUserAttendanceVerify.filter(
        (e) => e.userMasterID == user
      );

      const userAttendancePolicy = allUserEmployeeAttendancePolicy.filter(
        (e) => e.userMasterID == user
      );
      const userSalaryPolicy = allUserEmployeeSalaryPolicy.filter(
        (e) => e.userMasterID == user
      );

      const userShortLeavePolicy = allUserShortLeavePolicy.filter(
        (e) => e.userMasterID == user
      );

      const userCoffData = allUserCoffData.filter(
        (e) => e.userMasterID == user
      );

      const userShiftRosterData = allUserShiftRosterData.filter(
        (e) => e.userMasterID == user
      );

      const userOTData = allUserOTData.filter((e) => e.UserMasterID == user);

      const userExtraDaysData = allUserExtraDaysData.filter(
        (e) => e.userMasterID == user
      );

      let changeShift = false;
      if (attendanceVerify.length > 0) {
        changeShift = attendanceVerify.every(checkVerify);

        function checkVerify(item) {
          return item.verified == 1;
        }
      }

      if (!changeShift) {
        notattendanceVerifyUser.push(user);
        for (const attendance of attendancedata) {
          if (attendance.OutDateTime) {
            const dayname = new Date(attendance.AttendanceDate).toLocaleString(
              'en-us',
              {
                weekday: 'long',
              }
            );
            // user short leave
            const userShortLeave = attendance.userShortLeaves?.[0] || null;

            // shift time

            if (shiftSelection == 'auto') shift = attendance.shift;
            // -----------------if shift not found ----------------
            if (!shift) continue;

            // check user shift roster data----
            const roster = userShiftRosterData.find(
              (e) =>
                new Date(e.shiftRosterDate).getTime() ==
                new Date(attendance.AttendanceDate).getTime()
            );

            if (roster) {
              if (shiftSelection == 'manual') {
                // update roster
                await ShiftRoster.update(
                  {
                    shiftID: shift.shiftID,
                  },
                  {
                    where: {
                      shiftRosterID: roster.shiftRosterID,
                    },
                  }
                );
              }
            } else {
              // add shift roster data
              addShiftRosterData.push({
                userMasterID: user,
                shiftID: shift.shiftID,
                shiftRosterDate: attendance.AttendanceDate,
                createBy,
              });
            }

            const shiftTime = shift
              ? [...shift.shiftTimes].find((e) => e.day == dayname)
              : null;

            if (shiftTime) {
              updated_id.push(attendance.AttendanceTransID);

              let lateby;
              let date = formatAMPM(attendance.InDatetime);
              var startTime = moment(date, 'HH:mm a');
              var endTime = moment(shiftTime.statTime, 'HH:mm: a');

              var duration = moment.duration(startTime.diff(endTime));
              var hours = parseInt(duration.asHours());
              hours = hours * 60;
              var minutes = (parseInt(duration.asMinutes()) % 60) + hours;

              lateby = minutes > 0 ? minutes : '';

              let earlyBy;
              if (attendance.OutDateTime) {
                const EarlybyMinutes = await calculateEarlyby(
                  attendance.AttendanceDate,
                  shiftTime.statTime,
                  shiftTime.endtime,
                  new Date(attendance.OutDateTime)
                );
                if (EarlybyMinutes) {
                  earlyBy = EarlybyMinutes;
                } else {
                  earlyBy = '';
                }
              }
              const attendancePolicy = userAttendancePolicy.find(
                (e) =>
                  new Date(e.startDate).getTime() <=
                    new Date(attendance.AttendanceDate).getTime() &&
                  (!e.endDate ||
                    new Date(e.endDate).getTime() >=
                      new Date(attendance.AttendanceDate).getTime())
              );

              const attendance1 = attendancePolicy
                ? attendancePolicy.attendancePolicy
                : null;

              let totaltime = 0,
                skipMinutes = 0;
              if (attendance1) {
                if (attendance1.considerWorkingHours == 'includingouthours') {
                  let outHRS = attendance.OutHrs;
                  if (outHRS) {
                    totaltime = Number(attendance.InHrs) + Number(outHRS);
                  } else {
                    totaltime = Number(attendance.InHrs);
                  }
                } else {
                  totaltime = Number(attendance.InHrs);
                }

                // preshift hours consideration

                if (
                  attendance1.considerOvertimeAfter == 'totalworkinghours' &&
                  attendance1.preShiftHrsConsideration == 0
                ) {
                  if (
                    new Date(attendance.InDatetime) <
                    new Date(
                      attendance.AttendanceDate + ' ' + shiftTime.statTime
                    )
                  ) {
                    const diffMilliseconds =
                      new Date(
                        attendance.AttendanceDate + ' ' + shiftTime.statTime
                      ) - new Date(attendance.InDatetime);

                    skipMinutes = Math.floor(diffMilliseconds / (1000 * 60));
                    // skip minutes from fulldayhalfday minutes

                    totaltime -= +skipMinutes;
                  }
                }
              } else {
                let outHRS = attendance.OutHrs;
                if (outHRS) {
                  totaltime = Number(attendance.InHrs) + Number(outHRS);
                } else {
                  totaltime = Number(attendance.InHrs);
                }
              }

              const userComp = attendance.userMaster.companyMasterId;
              let inHours = 0;
              if (
                userComp &&
                +userComp.companyMasterId == 168 &&
                new Date(attendance.InDatetime) <
                  new Date(
                    attendance.AttendanceDate + ' ' + shiftTime.statTime
                  ) &&
                attendance.OutDateTime
              ) {
                totaltime = Math.round(
                  (new Date(attendance.OutDateTime).getTime() -
                    new Date(attendance.InDatetime).getTime()) /
                    (60 * 1000)
                );

                inHours = totaltime - +attendance.OutHrs;
                if (
                  attendance1 &&
                  attendance1.considerWorkingHours != 'includingouthours'
                ) {
                  totaltime = totaltime - +attendance.OutHrs;
                }

                const difference = Math.abs(
                  (new Date(
                    attendance.AttendanceDate + ' ' + shiftTime.statTime
                  ) -
                    new Date(attendance.InDatetime)) /
                    (1000 * 60)
                );
                totaltime = Math.round(totaltime - +difference);
                inHours = Math.round(inHours - +difference);
              }

              // --- find Short leave policy

              const emp_ShortLeavePolicy = userShortLeavePolicy.find(
                (e) =>
                  new Date(e.applicableDate).getTime() <=
                    new Date(attendance.AttendanceDate).getTime() &&
                  (!e.endDate ||
                    new Date(e.endDate).getTime() >=
                      new Date(attendance.AttendanceDate).getTime())
              );
              const shortLeavePolicy = emp_ShortLeavePolicy?.shortLeave || null;

              let shift_Grace = totaltime;

              // -----------------grace minutes to send in overtime function----------
              let grace = 0;

              if (shift && shift.shiftGrace) {
                shift_Grace = Number(shift.shiftGrace) + totaltime;
                grace = Number(shift.shiftGrace);
              }

              // set total time + add short leave minutes
              if (shortLeavePolicy && userShortLeave) {
                shift_Grace += +shortLeavePolicy.minutesForShortLeave;
                grace += +shortLeavePolicy.minutesForShortLeave;
              }

              let weekOffMinutes = 0;
              let normalDayMinutes = shift_Grace;
              const findWeekOffData = await findWeekoff_Without_trans(
                attendance.userMasterID,
                attendance.AttendanceDate
              );

              if (
                findWeekOffData &&
                findWeekOffData.WHDayType == 'SH' &&
                findWeekOffData.value == 0.5
              ) {
                const totalMinuteshalfday = shiftTime.totalhourshalfday * 60;
                if (
                  attendancePolicy &&
                  attendancePolicy.considerOvertimeAfter == 'totalworkinghours'
                ) {
                  if (shift_Grace > totalMinuteshalfday) {
                    weekOffMinutes = shift_Grace - totalMinuteshalfday;
                    shift_Grace = shift_Grace - weekOffMinutes;
                    normalDayMinutes = shift_Grace;
                  }
                } else {
                  if (
                    new Date(attendance.InDatetime) <
                    new Date(
                      attendance.AttendanceDate +
                        ' ' +
                        shiftTime.firsthalfendtime
                    )
                  ) {
                    if (
                      new Date(req.body.date) >
                      new Date(
                        attendance.AttendanceDate +
                          ' ' +
                          shiftTime.firsthalfendtime
                      )
                    ) {
                      const inTime = new Date(attendance.InDatetime).getTime();
                      const firstHalfEndTime = new Date(
                        attendance.AttendanceDate +
                          ' ' +
                          shiftTime.firsthalfendtime
                      ).getTime();

                      let differenceInMinutes =
                        (firstHalfEndTime - inTime) / 60000; // Convert ms to minutes

                      differenceInMinutes = differenceInMinutes - skipMinutes;
                      if (differenceInMinutes > 0) {
                        weekOffMinutes = shift_Grace - differenceInMinutes;
                        shift_Grace = differenceInMinutes;
                        normalDayMinutes = shift_Grace;
                      }
                    } else if (
                      new Date(attendance.InDatetime) >
                      new Date(
                        attendance.AttendanceDate +
                          ' ' +
                          shiftTime.firsthalfendtime
                      )
                    ) {
                      weekOffMinutes = shift_Grace;
                      shift_Grace = 0;
                      normalDayMinutes = shift_Grace;
                    }
                  }
                }
              }
              let fulldayhalfday = await executeQuery(
                'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
                  shift.shiftID +
                  ',' +
                  "'" +
                  dayname +
                  "'" +
                  ',' +
                  shift_Grace +
                  ')'
              );

              // set roundoff minutes
              const salaryPolicy = userSalaryPolicy.find(
                (e) =>
                  new Date(e.startDate).getTime() <=
                    new Date(attendance.AttendanceDate).getTime() &&
                  (!e.endDate ||
                    new Date(e.endDate).getTime() >=
                      new Date(attendance.AttendanceDate).getTime())
              );

              const salaryPolicyData = salaryPolicy
                ? salaryPolicy.salaryPolicy
                : null;

              let final_Minutes = Math.round(+totaltime);

              const temp_final_Minutes = final_Minutes;

              if (
                salaryPolicyData &&
                salaryPolicyData.salarycalculationBasedon == 'hourwise' &&
                salaryPolicyData.considerTimeType != 'actual'
              ) {
                if (salaryPolicyData.considerTimeValue) {
                  if (salaryPolicyData.considerTimeType == 'slotwise') {
                    final_Minutes =
                      Math.floor(
                        Math.round(+final_Minutes) /
                          +salaryPolicyData.considerTimeValue
                      ) * +salaryPolicyData.considerTimeValue;
                  }

                  if (salaryPolicyData.considerTimeType == 'roundoff') {
                    final_Minutes =
                      roundToNearestHour(
                        Math.round(+final_Minutes),
                        +salaryPolicyData.considerTimeValue
                      ) * 60;
                  }
                }
              }

              const extraMinutes = +temp_final_Minutes - +final_Minutes;

              if (
                userComp &&
                +userComp.companyMasterId == 168 &&
                new Date(attendance.InDatetime) <
                  new Date(
                    attendance.AttendanceDate + ' ' + shiftTime.statTime
                  ) &&
                attendance.OutDateTime
              ) {
                await attendanceTransaction.update(
                  {
                    InHrs: inHours,
                    Shift: String(shiftTime.shiftID),
                    Shifthrs: String(shiftTime.totalhours),
                    ShiftIntime: shiftTime.statTime,
                    ShiftoutTime: shiftTime.endtime,
                    updateBy: updateBy,
                    updateByIp: updateByIp,
                    LateBy: lateby,
                    EarlyBy: earlyBy,
                    fulldayhalfday: Number(fulldayhalfday[0].fulldayhalfday),
                    roundOffMinutes:
                      Math.round(+final_Minutes) > 0
                        ? Math.round(+final_Minutes)
                        : 0,
                  },
                  {
                    where: {
                      AttendanceTransID: attendance.AttendanceTransID,
                    },
                  }
                );
              } else {
                await attendanceTransaction.update(
                  {
                    Shift: String(shiftTime.shiftID),
                    Shifthrs: String(shiftTime.totalhours),
                    ShiftIntime: shiftTime.statTime,
                    ShiftoutTime: shiftTime.endtime,
                    updateBy: updateBy,
                    updateByIp: updateByIp,
                    LateBy: lateby,
                    EarlyBy: earlyBy,
                    fulldayhalfday: Number(fulldayhalfday[0].fulldayhalfday),
                    roundOffMinutes:
                      Math.round(+final_Minutes) > 0
                        ? Math.round(+final_Minutes)
                        : 0,
                  },
                  {
                    where: {
                      AttendanceTransID: attendance.AttendanceTransID,
                    },
                  }
                );
              }

              let isHoliday = await checkHoliday(
                attendance.userMasterID,
                attendance.AttendanceDate
              );

              await deleteOvertimeCoffExtraDaysMobile(
                attendance.userMasterID,
                attendance.AttendanceDate
              );

              if (isHoliday == 1) {
                let withoutOtMinutes = Math.round(+final_Minutes);
                if (attendance1) {
                  //If Coff
                  if (attendance1.coff) {
                    let total_In_Hrs = Math.round(+final_Minutes);
                    if (
                      findWeekOffData &&
                      findWeekOffData.WHDayType == 'SH' &&
                      findWeekOffData.value == 0.5
                    ) {
                      total_In_Hrs = weekOffMinutes;
                    }
                    //If Overtime
                    if (attendance1.coff == 'Overtime') {
                      // -----------------add without ot minutes in attendance transaction-------------------------
                      withoutOtMinutes = 0;

                      await coffOvertime(
                        attendance.userMasterID,
                        attendance.AttendanceTransID,
                        totaltime,
                        skipMinutes
                      );
                    } else if (attendance1.coff == 'AddLeave') {
                      if (attendance1.coffhalfday && attendance1.cofffullday) {
                        let coffValue = 0;
                        if (
                          total_In_Hrs >= Number(attendance1.coffhalfday) &&
                          total_In_Hrs < Number(attendance1.cofffullday)
                        ) {
                          coffValue = 0.5;
                        } else if (
                          total_In_Hrs >= Number(attendance1.cofffullday) &&
                          (!attendance1.coffOneAndHalfDay ||
                            total_In_Hrs <
                              Number(attendance1.coffOneAndHalfDay))
                        ) {
                          coffValue = 1;
                        } else if (
                          attendance1.coffOneAndHalfDay &&
                          total_In_Hrs >=
                            Number(attendance1.coffOneAndHalfDay) &&
                          (!attendance1.coffTwoFullDay ||
                            total_In_Hrs < Number(attendance1.coffTwoFullDay))
                        ) {
                          coffValue = 1.5;
                        } else if (
                          attendance1.coffTwoFullDay &&
                          total_In_Hrs >= Number(attendance1.coffTwoFullDay)
                        ) {
                          coffValue = 2;
                        }

                        if (coffValue > 0) {
                          await addCoff(
                            attendance.userMasterID,
                            attendance.AttendanceDate,
                            coffValue,
                            req.body.updateBy,
                            req.body.updateByIp
                          );
                        }
                      }
                    } else if (attendance1.coff == 'AddExtraDays') {
                      await addExtraDaysMobile(
                        attendance1,
                        attendance,
                        total_In_Hrs
                      );
                    }
                  }
                }

                // update attendance transaction
                await attendanceTransaction.update(
                  {
                    withoutOtMinutes,
                  },
                  { where: { AttendanceTransID: attendance.AttendanceTransID } }
                );
              } else {
                await overtime(
                  attendance.userMasterID,
                  attendance.AttendanceTransID,
                  skipMinutes,
                  extraMinutes,
                  grace
                );
              }
            }
          }
          let finaltransation = await attendanceTransaction.findOne({
            where: {
              AttendanceTransID: attendance.AttendanceTransID,
            },
          });
          await addFoodAllowanceInAttendance(finaltransation);
        }

        await shiftValidatePenaltyGoEary(
          user,
          startdate,
          enddate,
          userAttendancePolicy && userAttendancePolicy.length
            ? userAttendancePolicy[0].attendancePolicy
            : null
        );
      } else {
        attendanceVerifyUser.push(user);
      }
    }

    if (shiftSelection != 'auto') {
      // Upadte all users Shift roster which users attendance are not verified between selected dates
      await ShiftRoster.update(
        {
          shiftID: shift.shiftID,
          updateBy: createBy,
        },
        {
          where: {
            userMasterID: {
              [Sequelize.Op.in]: notattendanceVerifyUser,
            },
            shiftRosterDate: {
              [Sequelize.Op.between]: [startdate, enddate],
            },
          },
          hooks: false,
        }
      );
    }

    // Add remainig dates shift roster

    await ShiftRoster.bulkCreate(addShiftRosterData, { hooks: false });

    let attendanceVerifyUserData;
    let joinedNames;
    if (attendanceVerifyUser.length > 0) {
      attendanceVerifyUserData = await userMaster.findAll({
        where: {
          userMasterID: attendanceVerifyUser,
        },
        attributes: ['displayName'],
      });

      let displayNames = attendanceVerifyUserData.map(
        (user) => user.displayName
      );
      joinedNames = displayNames.join(', ');
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.attendanceTransactionupdate,
      data: updated_id,
      notattendanceVerifyUser:
        notattendanceVerifyUser.length > 0
          ? notattendanceVerifyUser.length + ' User Shift Change Successfully.'
          : '',
      attendanceVerifyUserData: joinedNames
        ? joinedNames + ' Attendance is Verify So Shift Can Not Be Change.'
        : '',
    });
  } catch (err) {
    next(err);
  }
};

async function shiftValidatePenaltyGoEary(
  userMasterID,
  startDate,
  endDate,
  attendance
) {
  const monthArray = await monthStartDateBetween(startDate, endDate);

  for (let i = 0; i < monthArray.length; i++) {
    const salaryPolicy = await employeeSalaryPolicy(
      userMasterID,
      monthArray[i]
    );

    let start_Date;
    let end_Date;

    const month = Number(monthArray[i].substring(5, 7));
    const year = Number(monthArray[i].substring(0, 4));
    let monday = daysInMonth(month, year);

    if (salaryPolicy) {
      const date = salaryPolicy['salaryPolicy.salaryCycleDate'];

      const salary_startdate = date < 10 ? '0' + date : date;

      start_Date = monthArray[i].substring(0, 8) + salary_startdate;

      // To Check salary consider Month

      if (salaryPolicy['salaryPolicy.salaryCycleConsider'] == 'E') {
        const tempDate = new Date(start_Date);
        tempDate.setMonth(tempDate.getMonth() - 1);

        start_Date =
          tempDate.getFullYear() +
          '-' +
          String(tempDate.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(tempDate.getDate()).padStart(2, '0');

        // set Month days
        monday = daysInMonth(start_Date.slice(5, 7), start_Date.slice(0, 4));
      }

      let date1 = new Date(start_Date);
      date1.setDate(date1.getDate() + (monday - 1));

      end_Date =
        date1.getFullYear() +
        '-' +
        String(date1.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date1.getDate()).padStart(2, '0');
    } else {
      start_Date = monthArray[i].substring(0, 8) + '01';

      end_Date = start_Date.substring(0, 8) + monday;
    }

    const monthly_Attendance = await attendanceTransaction.findAll({
      where: {
        userMasterID: userMasterID,
        AttendanceDate: {
          [Sequelize.Op.between]: [start_Date, end_Date],
        },
      },
      include: [
        {
          required: false,
          model: UserShortLeave,
          where: { authorizationStatus: 3 },
        },
        {
          model: Shift,
          attributes: ['shiftGrace'],
        },
      ],
      order: [['AttendanceDate', 'ASC']],
    });

    if (monthly_Attendance.length == 0) return;

    const LateEarlyPolicy = await employeeLateEarlyPolicy(
      monthly_Attendance[0].userMasterID,
      monthly_Attendance[0].AttendanceDate
    );
    if (LateEarlyPolicy) {
      if (
        LateEarlyPolicy['lateEarlyPolicy.lateEarlyPolicyType'] == 'combined'
      ) {
        await combined_deductionManual(
          monthly_Attendance,
          LateEarlyPolicy,
          attendance
        );
      } else {
        await penalty_deductionManual(
          monthly_Attendance,
          LateEarlyPolicy,
          attendance
        );
        await earlyby_deductionManual(
          monthly_Attendance,
          LateEarlyPolicy,
          attendance
        );
      }
    } else {
      await shiftValidateGoEarly(monthly_Attendance);
      await shiftValidatePenalty(monthly_Attendance);
    }
  }
}

async function shiftValidateGoEarly(monthly_Attendance) {
  if (monthly_Attendance.length > 1) {
    let count = 0;
    for (var i = 0; i < monthly_Attendance.length; i++) {
      const isOnLeave = await UserLeaves.findOne({
        where: {
          userMasterID: monthly_Attendance[i].userMasterID,
          DayType: 'Second Half',
          FromDate: {
            [Sequelize.Op.lte]: new Date(monthly_Attendance[i].AttendanceDate),
          },
          ToDate: {
            [Sequelize.Op.gte]: new Date(monthly_Attendance[i].AttendanceDate),
          },
        },
      });

      if (!isOnLeave) {
        const shift = await shiftModel.findOne({
          where: {
            shiftID: Number(monthly_Attendance[i].Shift),
          },
        });

        if (
          monthly_Attendance[i].EarlyBy &&
          shift.goEarly &&
          shift.goEarly > 0 &&
          shift.goEarlyallowdays &&
          shift.goEarlyallowdays > 0 &&
          Number(monthly_Attendance[i].fulldayhalfday) != 0
        ) {
          count++;

          if (count <= shift.goEarlyallowdays) {
            const dateOneObj = new Date(monthly_Attendance[i].InDatetime);
            const dateTwoObj = new Date(monthly_Attendance[i].OutDateTime);

            const milliseconds = Math.abs(dateTwoObj - dateOneObj);
            const hours = milliseconds / 36e5;

            let minutes = hours * 60;

            const totaltime = Number(minutes);

            let totalIN =
              Number(totaltime) +
              Number(shift.goEarly) +
              Number(shift.shiftGrace);
            let dayname = new Date(
              monthly_Attendance[i].AttendanceDate
            ).toLocaleString('en-us', {
              weekday: 'long',
            });

            let fulldayhalfday = await executeQuery(
              'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
                shift.shiftID +
                ',' +
                "'" +
                dayname +
                "'" +
                ',' +
                totalIN +
                ')'
            );

            if (Number(fulldayhalfday[0].fulldayhalfday) == 1) {
              let update_penalty = await attendanceTransaction.update(
                {
                  goEarlyUsed: 1,
                  fulldayhalfday: 1,
                },
                {
                  where: {
                    AttendanceTransID: monthly_Attendance[i].AttendanceTransID,
                  },
                }
              );
            } else {
              let update_penalty = await attendanceTransaction.update(
                {
                  goEarlyUsed: 0,
                },
                {
                  where: {
                    AttendanceTransID: monthly_Attendance[i].AttendanceTransID,
                  },
                }
              );
            }
          } else {
            let update_penalty = await attendanceTransaction.update(
              {
                goEarlyUsed: 0,
              },
              {
                where: {
                  AttendanceTransID: monthly_Attendance[i].AttendanceTransID,
                },
              }
            );
          }
        } else {
          let update_penalty = await attendanceTransaction.update(
            {
              goEarlyUsed: 0,
            },
            {
              where: {
                AttendanceTransID: monthly_Attendance[i].AttendanceTransID,
              },
            }
          );
        }
      } else {
        let update_penalty = await attendanceTransaction.update(
          {
            goEarlyUsed: 0,
          },
          {
            where: {
              AttendanceTransID: monthly_Attendance[i].AttendanceTransID,
            },
          }
        );
      }
    }
  } else if (monthly_Attendance.length == 0) {
    return;
  } else {
    const shift = await shiftModel.findOne({
      where: {
        shiftID: Number(monthly_Attendance[0].Shift),
      },
    });

    if (
      shift.goEarly &&
      shift.goEarly > 0 &&
      shift.goEarlyallowdays &&
      shift.goEarlyallowdays > 0
    ) {
      if (
        monthly_Attendance[0].EarlyBy != '' &&
        monthly_Attendance[0].EarlyBy != 0
      ) {
        if (shift.goEarly >= Number(monthly_Attendance[0].EarlyBy)) {
          //If First Day

          const dateOneObj = new Date(monthly_Attendance[0].InDatetime);
          const dateTwoObj = new Date(monthly_Attendance[0].OutDateTime);

          const milliseconds = Math.abs(dateTwoObj - dateOneObj);
          const hours = milliseconds / 36e5;

          let minutes = hours * 60;

          const totaltime = Number(minutes);

          let totalIN =
            Number(totaltime) +
            Number(shift.goEarly) +
            Number(shift.shiftGrace);
          let dayname = new Date(
            monthly_Attendance[0].AttendanceDate
          ).toLocaleString('en-us', {
            weekday: 'long',
          });

          let fulldayhalfday = await executeQuery(
            'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
              shift.shiftID +
              ',' +
              "'" +
              dayname +
              "'" +
              ',' +
              totalIN +
              ')'
          );

          if (Number(fulldayhalfday[0].fulldayhalfday) == 1) {
            let update_penalty = await attendanceTransaction.update(
              {
                goEarlyUsed: 1,
                fulldayhalfday: 1,
              },
              {
                where: {
                  AttendanceTransID: monthly_Attendance[0].AttendanceTransID,
                },
              }
            );
          }
        }
      } else {
        let update_penalty = await attendanceTransaction.update(
          {
            goEarlyUsed: 0,
          },
          {
            where: {
              AttendanceTransID: monthly_Attendance[0].AttendanceTransID,
            },
          }
        );
      }
    } else {
      let update_penalty = await attendanceTransaction.update(
        {
          goEarlyUsed: 0,
        },
        {
          where: {
            AttendanceTransID: monthly_Attendance[0].AttendanceTransID,
          },
        }
      );
    }
  }
}

async function shiftValidatePenalty(monthly_Attendance) {
  let count = 0;

  for (let k = 0; k < monthly_Attendance.length; k++) {
    const isHoliday = await checkHoliday(
      monthly_Attendance[k].userMasterID,
      monthly_Attendance[k].AttendanceDate
    );

    if (isHoliday != 1 && Number(monthly_Attendance[k].fulldayhalfday) != 0) {
      if (
        monthly_Attendance[k].LateBy != null &&
        monthly_Attendance[k].LateBy != ''
      ) {
        const shift = await shiftModel.findOne({
          where: {
            shiftID: Number(monthly_Attendance[k].Shift),
          },
        });

        if (shift.paneltyDeduction) {
          if (shift.graceIntime) {
            //In Time Grace
            if (
              Number(shift.graceIntime) >= Number(monthly_Attendance[k].LateBy)
            ) {
              const penalty = null;
              const penaltydeduction = null;

              let update_penalty = await attendanceTransaction.update(
                {
                  Panalty: penalty,
                  PanaltyDeduction: penaltydeduction,
                },
                {
                  where: {
                    AttendanceTransID: monthly_Attendance[k].AttendanceTransID,
                  },
                }
              );

              continue;
            }
          }

          if (shift.lateComing != null && shift.lateComing != '') {
            if (
              Number(shift.lateComing) >= Number(monthly_Attendance[k].LateBy)
            ) {
              let penalty = null;
              let penaltydeduction = null;

              if (shift.recuring == 0) {
                count++;

                if (count > Number(shift.allowDays)) {
                  if (shift.paneltyDeduction == 'day') {
                    penalty = shift.paneltyDays;
                    penaltydeduction = shift.paneltyDeduction;
                  } else if (shift.paneltyDeduction == 'amount') {
                    penalty = shift.paneltyAmount;
                    penaltydeduction = shift.paneltyDeduction;
                  } else {
                    penalty = shift.paneltyMin;
                    penaltydeduction = shift.paneltyDeduction;
                  }
                }
              } else {
                count++;

                if (count > Number(shift.allowDays)) {
                  if (shift.paneltyDeduction == 'day') {
                    penalty = shift.paneltyDays;
                    penaltydeduction = shift.paneltyDeduction;
                  } else if (shift.paneltyDeduction == 'amount') {
                    penalty = shift.paneltyAmount;
                    penaltydeduction = shift.paneltyDeduction;
                  } else {
                    penalty = shift.paneltyMin;
                    penaltydeduction = shift.paneltyDeduction;
                  }

                  count = 0;
                }
              }

              if (monthly_Attendance[k].fulldayhalfday == 0) {
                penalty = null;
                penaltydeduction = null;
              }
              let update_penalty = await attendanceTransaction.update(
                {
                  Panalty: penalty,
                  PanaltyDeduction: penaltydeduction,
                },
                {
                  where: {
                    AttendanceTransID: monthly_Attendance[k].AttendanceTransID,
                  },
                }
              );
            } else {
              if (monthly_Attendance[k].fulldayhalfday != 0) {
                const penalty = null;
                const penaltydeduction = null;
                //Latecoming Halfday
                await attendanceTransaction.update(
                  {
                    fulldayhalfday: 0.5,
                    Panalty: penalty,
                    PanaltyDeduction: penaltydeduction,
                  },
                  {
                    where: {
                      AttendanceTransID:
                        monthly_Attendance[k].AttendanceTransID,
                    },
                  }
                );
              }
            }
          }
        } else {
          const penalty = null;
          const penaltydeduction = null;

          const update_penalty = await attendanceTransaction.update(
            {
              Panalty: penalty,
              PanaltyDeduction: penaltydeduction,
            },
            {
              where: {
                AttendanceTransID: monthly_Attendance[k].AttendanceTransID,
              },
            }
          );
        }
      } else {
        const penalty = null;
        const penaltydeduction = null;

        const update_penalty = await attendanceTransaction.update(
          {
            Panalty: penalty,
            PanaltyDeduction: penaltydeduction,
          },
          {
            where: {
              AttendanceTransID: monthly_Attendance[k].AttendanceTransID,
            },
          }
        );
      }
    } else {
      const penalty = null;
      const penaltydeduction = null;

      let update_penalty = await attendanceTransaction.update(
        {
          Panalty: penalty,
          PanaltyDeduction: penaltydeduction,
          goEarlyUsed: 0,
        },
        {
          where: {
            AttendanceTransID: monthly_Attendance[k].AttendanceTransID,
          },
        }
      );
    }
  }
}

exports.getUserAttendanceSummary = async (req, res, next) => {
  try {
    const { startdate, enddate, userMasterID } = req.query;

    let monthStartDate = new Date(startdate);
    let monthEndDate = new Date(enddate);

    const userData = await userMaster.findOne({
      where: {
        userMasterID,
        status: 1,
      },
      include: [{ required: true, model: EmployeeJoiningDetails }],
    });

    if (!userData)
      return res.status(200).json({
        status: 401,
        message: 'User not found.',
      });

    // Employee Joining Date
    const EmployeeJoiningDate = userData.employeeJoiningDetails[0].joiningDate
      ? new Date(userData.employeeJoiningDetails[0].joiningDate)
      : null;

    if (EmployeeJoiningDate > monthStartDate) {
      monthStartDate = EmployeeJoiningDate;
    }

    // Leaving date
    const EmployeeLeaveingDate = userData.employeeJoiningDetails[0].leavingDate
      ? new Date(userData.employeeJoiningDetails[0].leavingDate)
      : null;
    if (EmployeeLeaveingDate && EmployeeLeaveingDate < monthEndDate) {
      monthEndDate = EmployeeLeaveingDate;
    }

    monthStartDate = monthStartDate.toISOString().slice(0, 10);
    monthEndDate = monthEndDate.toISOString().slice(0, 10);

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    //-------------------find leave -----------------------

    const userLeaveDetailsData = await UserLeave.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            // Leave starts within the date range
            FromDate: {
              [Sequelize.Op.between]: [monthStartDate, monthEndDate],
            },
          },
          {
            // Leave ends within the date range
            ToDate: { [Sequelize.Op.between]: [monthStartDate, monthEndDate] },
          },
          {
            // Leave spans the entire date range
            FromDate: { [Sequelize.Op.gte]: monthStartDate },
            ToDate: { [Sequelize.Op.lte]: monthEndDate },
          },
        ],
        userMasterID,
        status: 1,
        authorizationStatus: {
          [Sequelize.Op.ne]: 4,
        },
      },
      include: [
        {
          required: false,
          model: UserLeaveTransaction,
          attributes: ['status', 'date', 'days'],
        },
      ],
    });

    const leaveData = [];
    //--------------------------process leave data ------------------
    userLeaveDetailsData.forEach((element) => {
      const leavetransaction = element.userLeaveTransactions || [];

      // Check if no leave transactions exist and the authorization status is pending, approved, or partially approved
      if (
        leavetransaction.length == 0 &&
        [0, 1, 2].includes(element.authorizationStatus)
      ) {
        // Get all dates between the "FromDate" and "ToDate" (inclusive)
        const allDates = getAllDatesBetween(element.FromDate, element.ToDate);

        if (allDates.length == 1) {
          if (
            new Date(allDates[0]) >= new Date(monthStartDate) &&
            new Date(allDates[0]) <= new Date(monthEndDate)
          ) {
            // If there's only one date, push a single object with the entire leave duration
            leaveData.push({
              date: allDates[0],
              value: +element.LeaveDays,
            });
          }
        } else {
          // If there are multiple dates, push each date with a value of 1 day
          for (const date of allDates) {
            if (
              new Date(date) >= new Date(monthStartDate) &&
              new Date(date) <= new Date(monthEndDate)
            ) {
              leaveData.push({
                date: date,
                value: 1,
              });
            }
          }
        }
      }

      // Process leave transactions if they exist
      if (leavetransaction.length) {
        for (const leave of leavetransaction) {
          // If the leave transaction is approved (status == 1), add it to the leave data
          if (
            leave.status == 1 &&
            new Date(leave.date) >= new Date(monthStartDate) &&
            new Date(leave.date) <= new Date(monthEndDate)
          ) {
            leaveData.push({
              date: leave.date,
              value: +leave.days,
            });
          }
        }
      }
    });

    // ------------------final leaves data with values-----------------

    const leaveDataArray = Object.values(
      leaveData.reduce((acc, obj) => {
        if (!acc[obj.date]) {
          // If the date is not in the accumulator, create an entry
          acc[obj.date] = { date: obj.date, value: obj.value };
        } else {
          // If the date exists, add to the value
          acc[obj.date].value += obj.value;
        }
        return acc;
      }, {})
    );
    //--------------only leave dates-----------------

    const leaveDates = leaveDataArray.map((e) => e.date);

    // -----------------weekoff holiday without leave dates-----------------

    const userWeekOffHolidayDetailsData = await weekoffHolidayTran.findAll({
      where: {
        userMasterID: userMasterID,
        date: {
          [Sequelize.Op.between]: [monthStartDate, monthEndDate],
          [Sequelize.Op.notIn]: leaveDates,
        },
        [Sequelize.Op.and]: Sequelize.literal(`(date, "tableName") IN (
      SELECT date, MAX("tableName") AS max_tableName
      FROM "weekoffHolidayTrans"
      WHERE "userMasterID" = ${userMasterID}
        AND date BETWEEN '${monthStartDate}' AND '${monthEndDate}' AND ("optionalHoliday" IS FALSE OR  "optionalHoliday" IS null)
      GROUP BY date
    )`),
      },
      order: [
        ['date', 'ASC'],
        ['tableName', 'DESC'],
      ],
    });

    //------------------dates to not inlude in attendce data----------------

    const weekoffDates = [
      ...userWeekOffHolidayDetailsData.map((e) => e.date),
      ...leaveDataArray.filter((e) => e.value == 1).map((d) => d.date),
    ];

    // ------------------attendance data--------------------
    const userAttendanceDetailsData = await attendanceTransaction.findAll({
      where: {
        userMasterID: +userMasterID,
        AttendanceDate: {
          [Sequelize.Op.between]: [monthStartDate, monthEndDate],
          [Sequelize.Op.notIn]: weekoffDates,
        },
      },
    });
    // -------------------half day leaves------------------------
    const halfDaysLeaves = leaveDataArray
      .filter((e) => e.value == 0.5)
      .map((d) => d.date);

    let presentDays = 0,
      lateDays = 0,
      earlyDays = 0,
      missPunchDays = 0;

    //---------------calculate present days ,latedays early days and misspunch-------------------

    for (const att of userAttendanceDetailsData) {
      const dates = halfDaysLeaves.includes(att.AttendanceDate);

      if (att.OutDateTime) {
        if (dates && +att.fulldayhalfday == 1) {
          presentDays += 0.5;
        } else {
          presentDays += +att.fulldayhalfday;
        }
      }

      if (att.LateBy) lateDays++;
      if (att.EarlyBy) earlyDays++;
      if (!att.OutDateTime && new Date(att.AttendanceDate) < new Date(date))
        missPunchDays++;
    }

    // ------------------sum of weekoff and holidays---------------

    const weekoffValue = userWeekOffHolidayDetailsData
      .filter((e) => e.tableName == 'weekoff')
      .reduce((acc, obj) => acc + +obj.value, 0);
    const holidayValue = userWeekOffHolidayDetailsData
      .filter((e) => e.tableName == 'holiday')
      .reduce((acc, obj) => acc + +obj.value, 0);

    // leave sum
    const leaveDays = leaveDataArray.reduce((acc, obj) => acc + +obj.value, 0);

    //------------------total days in month---------------

    const totalDaysInMonth = calculateDays(monthStartDate, monthEndDate);
    //------------working days-----------
    const totalWorkingDays = totalDaysInMonth - (+holidayValue + +weekoffValue);
    //-------------absent days-------------------
    const absentDays = totalWorkingDays - (+presentDays + +leaveDays);

    res.status(200).json({
      status: 200,
      data: {
        presentDays,
        lateDays,
        earlyDays,
        userMasterID,
        weekoffValue,
        holidayValue,
        absentDays,
        leaveDays,
        missPunchDays,
        totalDaysInMonth,
        totalWorkingDays,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.dashboardpunchinoutNEW = async (req, res, next) => {
  try {
    let { companyMasterID, date, branchMasterID } = await req.query;

    let allActiveUsers,
      allActiveUsersID = [],
      AlluserCount = 0,
      total_punchin = 0,
      total_punchout = 0,
      total_weekoff = 0,
      total_onLeave = 0,
      finaldata = [];
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }

    // let dataaa = await getAllUserByBranch1(branchMasterID, "", "", date);
    if (branchMasterID) {
      const get_branch_users = await EmployeeBranch.findAndCountAll({
        raw: true,
        where: {
          branchID: branchMasterID,
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
          status: 1,
        },
      });
      let allActiveUsersID = [];
      for (let userID of get_branch_users.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }

      allActiveUsers = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(date) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(date),
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
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });
      // allActiveUsers = await getAllUserByBranchDateWise(
      //   branchMasterID,
      //   '',
      //   '',
      //   date
      // );

      for (let userID of allActiveUsers.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }
      AlluserCount = allActiveUsersID.length;
      total_punchin = await attendanceTransaction.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          AttendanceDate: date,
          InDatetime: {
            [Sequelize.Op.ne]: null,
          },
          OutDateTime: {
            [Sequelize.Op.eq]: null,
          },
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      for (let userid of total_punchin) {
        let tempID = allActiveUsersID.indexOf(userid.userMasterID);
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }
      total_punchin = total_punchin.length;

      total_punchout = await attendanceTransaction.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          AttendanceDate: date,
          InDatetime: {
            [Sequelize.Op.ne]: null,
          },
          OutDateTime: {
            [Sequelize.Op.ne]: null,
          },
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      for (let userid of total_punchout) {
        let tempID = allActiveUsersID.indexOf(userid.userMasterID);
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }
      total_punchout = total_punchout.length;

      total_weekoff = await weekoffHolidayTran.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          date: date,
          [Sequelize.Op.or]: [
            { optionalHoliday: false },
            { optionalHoliday: null },
          ],
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      for (let userid of total_weekoff) {
        let tempID = allActiveUsersID.indexOf(userid.userMasterID);
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }
      total_weekoff = total_weekoff.length;
      if (allActiveUsersID.length > 0) {
        total_onLeave = await executeQuery(
          `SELECT DISTINCT "userMasterID" from "userLeaves" as ul INNER join "userLeaveTransactions" as ult on ul."UserLeaveApplicationID"=ult."ReferenceID" WHERE ul."authorizationStatus" not in (4) and ul."status"=1 and ul."userMasterID" in (` +
            allActiveUsersID +
            `) and ult."status"=1 and (TO_DATE(ult."date", 'YYYY-MM-DD')>='` +
            date +
            `' and TO_DATE(ult."date", 'YYYY-MM-DD')<='` +
            date +
            `')`
        );
        for (let userid of total_onLeave) {
          let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
          if (tempID != -1) allActiveUsersID.splice(tempID, 1);
        }
        total_onLeave = total_onLeave.length;
        const findLeave = await UserLeave.findAll({
          raw: true,
          where: {
            userMasterID: allActiveUsersID,
            [Sequelize.Op.or]: [
              {
                FromDate: {
                  [Sequelize.Op.between]: [new Date(date), new Date(date)],
                },
              },
              {
                ToDate: {
                  [Sequelize.Op.between]: [new Date(date), new Date(date)],
                },
              },
              {
                FromDate: {
                  [Sequelize.Op.lte]: new Date(date),
                },
                ToDate: { [Sequelize.Op.gte]: new Date(date) },
              },
            ],
            authorizationStatus: [0, 1, 2],
          },
          group: ['userMasterID'],
          attributes: ['userMasterID'],
        });
        for (let userid of findLeave) {
          let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
          if (tempID != -1) allActiveUsersID.splice(tempID, 1);
        }
        total_onLeave = total_onLeave + findLeave.length;
      }
    } else {
      allActiveUsers = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: date,
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: date },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: date },
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
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });
      // allActiveUsers = await getAllUserByCompanyDateWise(
      //   companyMasterID,
      //   '',
      //   '',
      //   date
      // );

      for (let userID of allActiveUsers.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }
      AlluserCount = allActiveUsersID.length;
      total_punchin = await attendanceTransaction.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          AttendanceDate: date,
          InDatetime: {
            [Sequelize.Op.ne]: null,
          },
          OutDateTime: {
            [Sequelize.Op.eq]: null,
          },
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      for (let userid of total_punchin) {
        let tempID = allActiveUsersID.indexOf(userid.userMasterID);
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }
      total_punchin = total_punchin.length;

      total_punchout = await attendanceTransaction.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          AttendanceDate: date,
          InDatetime: {
            [Sequelize.Op.ne]: null,
          },
          OutDateTime: {
            [Sequelize.Op.ne]: null,
          },
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      for (let userid of total_punchout) {
        let tempID = allActiveUsersID.indexOf(userid.userMasterID);
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }
      total_punchout = total_punchout.length;

      total_weekoff = await weekoffHolidayTran.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          date: date,
          [Sequelize.Op.or]: [
            { optionalHoliday: false },
            { optionalHoliday: null },
          ],
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      for (let userid of total_weekoff) {
        let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }
      total_weekoff = total_weekoff.length;
      if (allActiveUsersID.length > 0) {
        total_onLeave = await executeQuery(
          `SELECT DISTINCT "userMasterID" from "userLeaves" as ul INNER join "userLeaveTransactions" as ult on ul."UserLeaveApplicationID"=ult."ReferenceID" WHERE ul."authorizationStatus" not in (4) and ul."status"=1 and ul."userMasterID" in (` +
            allActiveUsersID +
            `) and ult."status"=1 and (TO_DATE(ult."date", 'YYYY-MM-DD')>='` +
            date +
            `' and TO_DATE(ult."date", 'YYYY-MM-DD')<='` +
            date +
            `')`
        );
        for (let userid of total_onLeave) {
          let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
          if (tempID != -1) allActiveUsersID.splice(tempID, 1);
        }
        total_onLeave = total_onLeave.length;
        const findLeave = await UserLeave.findAll({
          raw: true,
          where: {
            userMasterID: allActiveUsersID,
            [Sequelize.Op.or]: [
              {
                FromDate: {
                  [Sequelize.Op.between]: [new Date(date), new Date(date)],
                },
              },
              {
                ToDate: {
                  [Sequelize.Op.between]: [new Date(date), new Date(date)],
                },
              },
              {
                FromDate: {
                  [Sequelize.Op.lte]: new Date(date),
                },
                ToDate: { [Sequelize.Op.gte]: new Date(date) },
              },
            ],
            authorizationStatus: [0, 1, 2],
          },
          group: ['userMasterID'],
          attributes: ['userMasterID'],
        });
        for (let userid of findLeave) {
          let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
          if (tempID != -1) allActiveUsersID.splice(tempID, 1);
        }
        total_onLeave = total_onLeave + findLeave.length;
      }
    }

    finaldata.push({
      allActiveUser: AlluserCount,
      total_punchin: total_punchin,
      total_punchout: total_punchout,
      total_weekoff: total_weekoff,
      total_onLeave: total_onLeave,
      total_notpunchin: allActiveUsersID.length,
    });

    res.status(200).json({ status: 200, data: finaldata });
  } catch (err) {
    next(err);
  }
};

function getFirstAndLastDateOfMonth(year, month) {
  // Create a date object for the first day of the month
  const firstDate = new Date(year, month - 1, 1);

  // Calculate the last day of the month
  const lastDate = new Date(year, month, 0);

  // Format the dates as 'YYYY-MM-DD' strings
  const formattedFirstDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const formattedLastDate = `${year}-${String(month).padStart(2, '0')}-${String(
    lastDate.getDate()
  ).padStart(2, '0')}`;

  return {
    firstDate: formattedFirstDate,
    lastDate: formattedLastDate,
  };
}

exports.dashboardattendanceNEW = async (req, res, next) => {
  try {
    let { companyMasterID, YYYYMM } = await req.query;
    if (!YYYYMM)
      YYYYMM =
        new Date().toISOString().slice(0, 4) +
        new Date().toISOString().slice(5, 7);

    const companyData = await companyMaster.findOne({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      raw: true,
    });

    if (!companyData) {
      return res
        .status(200)
        .json({ status: 401, message: 'Company is Deactivated or Deleted.' });
    }

    const { firstDate, lastDate } = getFirstAndLastDateOfMonth(
      YYYYMM.substring(0, 4),
      YYYYMM.substring(4, 6)
    );

    const datesArray = await getDatesFromDateRange(
      new Date(firstDate),
      new Date(lastDate)
    );
    // const datesArray = [new Date(firstDate)]

    const label = [];
    const AttendanceData1 = [];
    AttendanceData1.push(
      { data: [], label: 'Present' },
      { data: [], label: 'Halfday' },
      { data: [], label: 'MissPunch' },
      { data: [], label: 'Holiday' },
      { data: [], label: 'weekoff' },
      { data: [], label: 'Leave' },
      { data: [], label: 'Absent' }
    );

    for (const date of datesArray) {
      label.push(date.toISOString().slice(8, 10));

      const allActiveUsers = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: date,
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: date },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: date },
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
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });

      // const allActiveUsers = await getAllUserByCompanyDateWise(
      //   companyMasterID,
      //   '',
      //   '',
      //   date
      // );
      const allActiveUsersID = [];
      for (let userID of allActiveUsers.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }

      //Present
      const totalPresent = await attendanceTransaction.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          AttendanceDate: new Date(date).toISOString().slice(0, 10),
          fulldayhalfday: 1,
          InDatetime: {
            [Sequelize.Op.ne]: null,
          },
          OutDateTime: {
            [Sequelize.Op.ne]: null,
          },
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      AttendanceData1[0].data.push(totalPresent.length);

      for (let userid of totalPresent) {
        let tempID = allActiveUsersID.indexOf(userid.userMasterID);
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }

      //Halfday
      const totalHalfDay = await attendanceTransaction.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          AttendanceDate: new Date(date).toISOString().slice(0, 10),
          fulldayhalfday: 0.5,
          InDatetime: {
            [Sequelize.Op.ne]: null,
          },
          OutDateTime: {
            [Sequelize.Op.ne]: null,
          },
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      AttendanceData1[1].data.push(totalHalfDay.length);

      for (let userid of totalHalfDay) {
        let tempID = allActiveUsersID.indexOf(userid.userMasterID);
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }

      //MissPunch
      const totalMissPunch = await attendanceTransaction.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          AttendanceDate: new Date(date).toISOString().slice(0, 10),
          InDatetime: {
            [Sequelize.Op.ne]: null,
          },
          OutDateTime: {
            [Sequelize.Op.eq]: null,
          },
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });

      if (
        new Date(date).toISOString().slice(0, 10) !=
        new Date().toISOString().slice(0, 10)
      ) {
        AttendanceData1[2].data.push(totalMissPunch.length);
      } else {
        AttendanceData1[0].data[AttendanceData1[0].data.length - 1] =
          AttendanceData1[0].data[AttendanceData1[0].data.length - 1] +
          totalMissPunch.length;
      }

      for (let userid of totalMissPunch) {
        let tempID = allActiveUsersID.indexOf(userid.userMasterID);
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }

      //Holiday
      const totalHoliday = await weekoffHolidayTran.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          date: new Date(date).toISOString().slice(0, 10),
          tableName: 'holiday',
          [Sequelize.Op.or]: [
            { optionalHoliday: false },
            { optionalHoliday: null },
          ],
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      AttendanceData1[3].data.push(totalHoliday.length);

      for (let userid of totalHoliday) {
        let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }

      //Weekoff
      const totalWeekoff = await weekoffHolidayTran.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          date: new Date(date).toISOString().slice(0, 10),
          tableName: 'weekoff',
          [Sequelize.Op.or]: [
            { optionalHoliday: false },
            { optionalHoliday: null },
          ],
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      AttendanceData1[4].data.push(totalWeekoff.length);

      for (let userid of totalWeekoff) {
        let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }

      //Leave
      let total_onLeave = [];

      if (allActiveUsers.length > 0) {
        total_onLeave = await executeQuery(
          `SELECT DISTINCT "userMasterID" from "userLeaves" as ul INNER join "userLeaveTransactions" as ult on ul."UserLeaveApplicationID"=ult."ReferenceID" WHERE ul."authorizationStatus" not in (4) and ul."status"=1 and ul."userMasterID" in (` +
            allActiveUsersID +
            `) and ult."status"=1 and (TO_DATE(ult."date", 'YYYY-MM-DD')>='` +
            new Date(date).toISOString().slice(0, 10) +
            `' and TO_DATE(ult."date", 'YYYY-MM-DD')<='` +
            new Date(date).toISOString().slice(0, 10) +
            `')`
        );
      }
      for (let userid of total_onLeave) {
        let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }

      total_onLeave = total_onLeave.length;
      const findLeave = await UserLeave.findAll({
        raw: true,
        where: {
          userMasterID: allActiveUsersID,
          [Sequelize.Op.or]: [
            {
              FromDate: {
                [Sequelize.Op.between]: [new Date(date), new Date(date)],
              },
            },
            {
              ToDate: {
                [Sequelize.Op.between]: [new Date(date), new Date(date)],
              },
            },
            {
              FromDate: {
                [Sequelize.Op.lte]: new Date(date),
              },
              ToDate: { [Sequelize.Op.gte]: new Date(date) },
            },
          ],
          authorizationStatus: [0, 1, 2],
        },
        group: ['userMasterID'],
        attributes: ['userMasterID'],
      });
      for (let userid of findLeave) {
        let tempID = allActiveUsersID.indexOf(Number(userid.userMasterID));
        if (tempID != -1) allActiveUsersID.splice(tempID, 1);
      }
      AttendanceData1[5].data.push(total_onLeave + findLeave.length);

      //Absent

      if (
        new Date(date).toISOString().slice(0, 10) <=
        new Date().toISOString().slice(0, 10)
      ) {
        AttendanceData1[6].data.push(allActiveUsersID.length);
      } else {
        AttendanceData1[6].data.push(0);
      }
    }

    res.status(200).json({ status: 200, label: label, data: AttendanceData1 });
  } catch (err) {
    next(err);
  }
};

exports.dashboardMisspunchReport = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      branchID,
      fromDate,
      toDate,
      users,
      page,
      limit,
      exportData,
    } = req.body;

    /** Validate from date and to date */
    if (new Date(fromDate) > new Date(toDate)) {
      return res
        .status(200)
        .json({ status: 401, message: 'Please pass valid date range' });
    }

    /** Prepare dynamic query for fetching active user */
    const activeUserMasterCondition = {};

    if (users) {
      /** if users length is passed then fetch active user from list */
      activeUserMasterCondition.userMasterID = users;
    } else if (branchID != '' && branchID != null && branchID != 'null') {
      /** if branchId is passed then fetch active user from branc */

      /** Validate branch */
      let getBranch = await BranchMaster.findOne({
        raw: true,
        where: {
          branchMasterID: branchID,
          status: 1,
          '$companyMaster.status$': 1,
        },
        include: [{ model: companyMaster }],
      });

      if (!getBranch) {
        return res
          .status(200)
          .json({ status: 401, message: 'Company or Branch deactivated!' });
      }

      /** Fetch Branch Users */
      const branchWiseUserList = await EmployeeBranch.findAll({
        raw: true,
        where: {
          branchID: branchID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(fromDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(fromDate),
              },
            },
            {
              endDate: null,
            },
          ],
          status: 1,
        },
        attributes: ['userMasterID'],
      });

      activeUserMasterCondition.userMasterID = branchWiseUserList.map(
        (e) => e.userMasterID
      );
    } else if (companyMasterID) {
      /** if companyMasterId is passed then get all active user of the company */

      /** Validate company */
      let getCompany = await companyMaster.findOne({
        raw: true,
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
      });

      if (!getCompany) {
        return res
          .status(200)
          .json({ status: 401, message: 'Company deactivated or Deleted!' });
      }
      activeUserMasterCondition['$userMaster.companyMasterId$'] =
        companyMasterID;
    } else {
      return res
        .status(200)
        .json({ status: 401, message: 'Please pass valid Parameters' });
    }

    /** Fetch all active user details */
    const allActiveUsers = await EmployeeJoiningDetails.findAll({
      raw: true,
      where: {
        joiningDate: {
          [Sequelize.Op.lte]: fromDate,
        },
        [Sequelize.Op.or]: [
          {
            leavingDate: { [Sequelize.Op.gte]: fromDate },
          },
          {
            leavingDate: { [Sequelize.Op.eq]: null },
            [Sequelize.Op.or]: [
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: fromDate },
              },
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
              },
            ],
          },
        ],
        '$userMaster.status$': [0, 1],
        ...activeUserMasterCondition,
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      attributes: ['userMasterID'],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });

    /** If no active user found then send empty response */
    if (!allActiveUsers?.length) {
      return res.status(200).json({ status: 200, data: [], totalcount: 0 });
    }

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    /** Prepare MissPunch Report Attendance Query */
    const condition = {
      userMasterID: allActiveUsers.map((e) => e.userMasterID),
      OutDateTime: { [Sequelize.Op.eq]: null },
      AttendanceDate: {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
        [Sequelize.Op.ne]: new Date().toISOString().slice(0, 10),
      },
    };

    /** Fetch Attendance data for miss punch report */
    const { rows: AttendanceData, count: totalcount } =
      await attendanceTransaction.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order: [['AttendanceDate', 'DESC']],
        attributes: [
          'userMasterID',
          'InDatetime',
          'OutDateTime',
          'AttendanceDate',
          'AttendanceTransID',
          'designationID',
        ],
        include: [
          { model: Department, attributes: ['departmentName'] },
          { model: BranchMaster, attributes: ['branchName'] },
          {
            model: UserMaster,
            attributes: [
              'displayName',
              'photo',
              'companyMasterId',
              'userNumber',
            ],
            include: [
              {
                model: EmployeeJoiningDetails,
                attributes: ['employeeCode'],
              },
              {
                required: false,
                model: EmployeeDesignation,
                where: {
                  status: 1,
                  applicableDate: {
                    [Sequelize.Op.lte]: Sequelize.col('AttendanceDate'),
                  },
                  [Sequelize.Op.or]: [
                    {
                      endDate: {
                        [Sequelize.Op.gte]: Sequelize.col('AttendanceDate'),
                      },
                    },
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
            ],
          },
        ],
      });

    if (true == exportData) {
      const finalData = [];

      for (const item of AttendanceData) {
        const tempObj = {
          'Employee Code':
            item.userMaster?.employeeJoiningDetails?.[0]?.employeeCode || '',
          Name: item.userMaster?.displayName || '',
          Designation:
            item.userMaster?.employeeDesignations?.[0]?.designation
              ?.designationName || '',
          'Mobile Number': item.userMaster?.userNumber || '',
          Branch: item.branchMaster?.branchName || '',
          Department: item.department?.departmentName || '',
          'Attendance Date': item.AttendanceDate
            ? moment(item.AttendanceDate).format('DD-MM-YYYY')
            : '',
          'Log Date Time': item.InDatetime
            ? moment(item.InDatetime).format('DD-MM-YYYY HH:mm:ss')
            : '',
        };
        finalData.push(tempObj);
      }

      await generateExcelForPunchInPunchOutReport(
        finalData,
        'Miss-Punch-Report',
        'xlsx',
        res
      );
      return;
    } else {
      /** Map Data */
      for (const item of AttendanceData) {
        if (item?.userMaster?.employeeDesignations) {
          item.designationID =
            item.userMaster.employeeDesignations[0]?.designation
              ?.designationName || '';
        } else {
          item.designationID = '';
        }
        item.dataValues.employeeCode =
          item.userMaster?.employeeJoiningDetails?.[0]?.employeeCode || '';
      }
    }
    return res
      .status(200)
      .json({ status: 200, data: AttendanceData, totalcount });
  } catch (err) {
    next(err);
  }
};

exports.LateComeEarlyGoReport = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      fromDate,
      toDate,
      page,
      limit,
      exportData,
      exportFileType,
    } = req.query;
    const companyID = companyMasterID;

    if (!fromDate || !toDate || !companyID) {
      return res.status(200).json({
        status: 401,
        message:
          'Please provide the "from date," "to date," and "company ID" to proceed.',
      });
    }

    const condition = {};
    condition['$userMaster.companyMasterId$'] = companyID;
    condition.AttendanceDate = {
      [Sequelize.Op.between]: [fromDate, toDate],
    };
    condition[Sequelize.Op.or] = [
      {
        LateBy: { [Sequelize.Op.ne]: null },
        LateBy: { [Sequelize.Op.ne]: '' },
      },
      {
        EarlyBy: { [Sequelize.Op.ne]: null },
        EarlyBy: { [Sequelize.Op.ne]: '' },
      },
    ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['AttendanceDate', 'ASC']];

    const AttendanceData = await attendanceTransaction.findAndCountAll({
      distinct: true,
      // raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          // attributes: ['displayName', 'userNumber', 'companyMasterId'],
          required: true,
          ...accessibleUsers(req.userDetails),
          include: [
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode', 'salarytype'],
            },
          ],
        },
      ],
    });

    if (exportData) {
      const Staff = [];
      const Wages = [];
      const Others = [];

      var s = 1,
        w = 1,
        o = 1;

      const shiftIds = [...new Set(AttendanceData.rows.map((e) => +e.Shift))];

      const getAllShift = await Shift.findAll({
        where: {
          shiftID: shiftIds,
        },
      });

      const lateEarlyAllUsers_Count_Array = [];

      for (let item of AttendanceData.rows) {
        const getShift = getAllShift.find((e) => +e.shiftID == +item.Shift);

        let lateearly = '',
          no;
        if (item.LateBy && item.EarlyBy) lateearly = 'Late In/ Early out';
        else if (item.LateBy) lateearly = 'Late In';
        else if (item.EarlyBy) lateearly = 'Early out';

        const financialYearDatesResult = financialYearDates(toDate);

        const already_findData = lateEarlyAllUsers_Count_Array.find(
          (e) => e.userMasterID == item.userMasterID
        );

        if (already_findData) {
          no = +already_findData.lateByCount + +already_findData.earlyByCount;
        } else {
          const LatebyCount = await attendanceTransaction.count({
            raw: true,
            where: {
              LateBy: { [Sequelize.Op.ne]: null },
              LateBy: { [Sequelize.Op.ne]: '' },
              AttendanceDate: {
                [Sequelize.Op.between]: [
                  financialYearDatesResult.start,
                  financialYearDatesResult.end,
                ],
              },
              userMasterID: item.userMasterID,
            },
            include: [
              {
                model: UserMaster,
                // attributes: ['displayName', 'userNumber', 'companyMasterId'],
                required: true,
                ...accessibleUsers(req.userDetails),
              },
            ],
            attributes: ['AttendanceDate'],
            group: ['AttendanceDate'],
          });

          const EarlybyCount = await attendanceTransaction.count({
            raw: true,
            where: {
              EarlyBy: { [Sequelize.Op.ne]: null },
              EarlyBy: { [Sequelize.Op.ne]: '' },
              AttendanceDate: {
                [Sequelize.Op.between]: [
                  financialYearDatesResult.start,
                  financialYearDatesResult.end,
                ],
              },
              userMasterID: item.userMasterID,
            },
            include: [
              {
                model: UserMaster,
                // attributes: ['displayName', 'userNumber', 'companyMasterId'],
                required: true,
                ...accessibleUsers(req.userDetails),
              },
            ],
            attributes: ['AttendanceDate'],
            group: ['AttendanceDate'],
          });

          lateEarlyAllUsers_Count_Array.push({
            userMasterID: item.userMasterID,
            lateByCount: LatebyCount.length,
            earlyByCount: EarlybyCount.length,
          });

          no = LatebyCount.length + EarlybyCount.length;
        }

        let type = null;
        let employeeCode = '';
        const joining =
          item.userMaster.employeeJoiningDetails &&
          item.userMaster.employeeJoiningDetails.length > 0
            ? item.userMaster.employeeJoiningDetails[0]
            : null;
        if (joining && joining.salarytype == 'S') type = 'S';
        if (joining && joining.salarytype == 'W') type = 'W';
        if (joining) employeeCode = joining.employeeCode;

        let item1 = {
          'Sr No.': type == 'W' ? w : type == 'S' ? s : o,
          'Employee Code': employeeCode,
          'Name of Employee': item.userMaster.displayName,
          'Number of Employee': item.userMaster.userNumber,
          'Late In/Early Out': lateearly,
          Date: getDDMMYYYYdate(item.AttendanceDate),

          Shift:
            getShift.shiftName +
            '(' +
            item.ShiftIntime +
            ' to ' +
            item.ShiftoutTime +
            ' )',
          In: new Date(
            new Date(item.InDatetime).getTime() -
              new Date(item.InDatetime).getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(11, 19),
          Out: item.OutDateTime
            ? new Date(
                new Date(item.OutDateTime).getTime() -
                  new Date(item.OutDateTime).getTimezoneOffset() * 60000
              )
                .toISOString()
                .slice(11, 19)
            : '',
          'Late In by(Minutes)': item.LateBy ? item.LateBy : 0,
          'Early Out by(Minutes)': item.EarlyBy ? item.EarlyBy : 0,
          'No. of times Late In/Early out in FY': no,
        };
        type == 'W'
          ? Wages.push(item1)
          : type == 'S'
            ? Staff.push(item1)
            : Others.push(item1);
        type == 'W' ? w++ : type == 'S' ? s++ : o++;
      }

      if (Staff.length == 0 && Wages.length == 0 && Others.length == 0) {
        let item1 = {
          'Sr No.': '',
          'Employee Code': '',
          'Name of Employee': '',
          'Number of Employee': '',
          'Late In/Early Out': '',
          Date: '',
          Shift: '',
          In: '',
          Out: '',
          'Late In by(Minutes)': '',
          'Early Out by(Minutes)': '',
          'No. of times Late In/Early out in FY': '',
        };
        Others.push(item1);
      }

      const finalData = [];
      const Names = [];
      if (Staff.length != 0) finalData.push(Staff), Names.push('Staff');
      if (Wages.length != 0) finalData.push(Wages), Names.push('Wages');
      if (Others.length != 0) finalData.push(Others), Names.push('Others');

      await generateChecklistExcel(
        finalData,
        'LateByEarlyGo',
        'xlsx',
        res,
        Names
      );
    } else {
      return res.status(200).json({
        status: 200,
        data: AttendanceData.rows,
        totalcount: AttendanceData.count,
      });
    }
  } catch (err) {
    next(err);
  }
};

function financialYearDates(currentDate) {
  const dateObj = new Date(currentDate);
  const startOfYear = new Date(dateObj.getFullYear(), 3, 1);
  const endOfYear = new Date(dateObj.getFullYear() + 1, 2, 31);

  if (dateObj < startOfYear) {
    return {
      start: formatDate(new Date(dateObj.getFullYear() - 1, 3, 1)),
      end: formatDate(new Date(dateObj.getFullYear(), 2, 31)),
    };
  } else {
    return {
      start: formatDate(startOfYear),
      end: formatDate(endOfYear),
    };
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function getFomatedData(sortedArray1, user) {
  const absentArray = [];

  let currentRange = null;

  sortedArray1.forEach((date) => {
    if (!currentRange) {
      currentRange = {
        userMasterID: user.userMasterID,
        displayName: user.userMaster.displayName,
        FromDate: date,
        ToDate: date,
        authorizationStatus: 'Absent',
        LeaveDays: 1,
      };
    } else {
      const currentDate = new Date(date);
      const nextExpectedDate = new Date(currentRange.ToDate);
      nextExpectedDate.setDate(nextExpectedDate.getDate() + 1);

      if (currentDate.getTime() === nextExpectedDate.getTime()) {
        currentRange.ToDate = date;
        currentRange.LeaveDays += 1;
      } else {
        absentArray.push({ ...currentRange });
        currentRange = {
          userMasterID: user.userMasterID,
          displayName: user.userMaster.displayName,
          FromDate: date,
          ToDate: date,
          authorizationStatus: 'Absent',
          LeaveDays: 1,
        };
      }
    }
  });

  // Add the last range to the result array
  if (currentRange) {
    absentArray.push({ ...currentRange });
  }

  return absentArray;
}

exports.getLeaveExcel = async (req, res, next) => {
  try {
    let { companyMasterID } = req.query;

    let sendmail = false;

    if (companyMasterID) {
      companyMasterID = [companyMasterID];
    } else {
      sendmail = true;

      const allCompany = await RolePermission.findAll({
        raw: true,
        include: [
          { model: RoleMaster, attributes: [] },
          {
            model: FormMaster,
            where: { formName: 'FYWiseLeaveReport' },
            attributes: [],
          },
        ],
        attributes: [
          [Sequelize.col('roleMaster.roleMasterID'), 'roleMasterID'],
          [Sequelize.col('roleMaster.companyMasterID'), 'companyMasterID'],
        ],
      });

      const companyids = allCompany.map((item) => +item.companyMasterID);

      const findNotificationPolicy = await notificationPolicy.findAll({
        raw: true,
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyids,
          },
          status: 1,
        },
        attributes: [[Sequelize.col('companyMasterID'), 'companyMasterID']],
      });

      companyMasterID = findNotificationPolicy.map(
        (item) => +item.companyMasterID
      );
    }

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const oneDayBeforedate = new Date(date);
    oneDayBeforedate.setDate(new Date(date).getDate() - 1);

    const dates = await getFinancialYearDatesFromDate(date);

    const startDate = dates.startDate;
    const endDate = dates.endDate;

    for (const compid of companyMasterID) {
      req.userDetails.accessibleCompanies = compid;

      const leave = await hrLeaveTypes.findAll({
        raw: true,
        where: {
          companyMasterID: compid,
          Leave_Allow: 'Y',
          status: 1,
        },
        include: [
          { model: HrLeaveMaster, as: 'LeaveMaster', attributes: [] },
          { model: companyMaster },
        ],
        attributes: [
          [Sequelize.col('LeaveMaster.LeaveName'), 'LeaveName'],
          [Sequelize.col('companyMaster.companyName'), 'companyName'],
        ],
      });

      const month = month_dict[startDate.slice(5, 7)];

      const firstHeader =
        `${leave.length > 0 ? leave[0].companyName : ''}` +
        ' Leave Update ' +
        `${month}` +
        '-' +
        startDate.slice(0, 4);

      const leaveHeader = leave.map((e) => e.LeaveName).concat('A');

      const startdate = date.slice(0, 8) + '01';

      // set date of after two months

      const inputDate = new Date(startdate);
      inputDate.setMonth(inputDate.getMonth() + 2, inputDate.getDate() - 1);
      let enddate =
        inputDate.getFullYear() +
        '-' +
        ('0' + (inputDate.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + inputDate.getDate()).slice(-2);

      if (new Date(enddate) > new Date(endDate)) enddate = endDate;

      const userLeave = await UserLeave.findAll({
        raw: true,
        where: {
          status: 1,
          FromDate: { [Sequelize.Op.lte]: enddate },
          ToDate: { [Sequelize.Op.gte]: startdate },
          authorizationStatus: {
            [Sequelize.Op.notIn]: [4],
          },
        },
        include: [
          {
            model: UserMaster,
            where: { companyMasterId: compid },
            required: true,
            ...accessibleUsers(req.userDetails, false, false),
            attributes: [],
            include: [{ model: EmployeeJoiningDetails, attributes: [] }],
          },
        ],
        attributes: [
          'userMasterID',
          Sequelize.col('userMaster.displayName', 'displayName'),
          'FromDate',
          'ToDate',
          'authorizationStatus',
          'LeaveDays',
          [Sequelize.col('userMaster.deactiveDate'), 'deactiveDate'],
          [
            Sequelize.col('userMaster.employeeJoiningDetails.joiningDate'),
            'joiningDate',
          ],
          [
            Sequelize.col('userMaster.employeeJoiningDetails.leavingDate'),
            'leavingDate',
          ],
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });

      const beforeEndDate =
        new Date(startdate).getFullYear() +
        '-' +
        ('0' + (new Date(startdate).getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + (new Date(startdate).getDate() - 1)).slice(-2);

      const users = await EmployeeJoiningDetails.findAll({
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
          '$userMaster.companyMasterId$': compid,
          '$userMaster.status$': [0, 1],
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
            include: [
              {
                model: EmployeeDepartment,
                where: {
                  status: 1,
                  applicableDate: {
                    [Sequelize.Op.lte]: new Date(oneDayBeforedate),
                  },
                  [Sequelize.Op.or]: [
                    {
                      endDate: {
                        [Sequelize.Op.gte]: new Date(oneDayBeforedate),
                      },
                    },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: false,
                include: [{ model: Department, as: 'department' }],
              },
            ],
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });

      const isDateInRange = (date, fromdate, todate) =>
        date >= fromdate && date <= todate;

      const final = [];
      const salaryTypeStaff = [];
      const salaryTypeWages = [];
      const SalatTypeNotSet = [];
      let srno = 0;

      for (const user of users) {
        // create startdate and enddate for get data of current month from 1st date to one day before today date

        const fyStartDate =
          new Date(user.joiningDate) > new Date(startdate)
            ? user.joiningDate
            : startdate;
        const fyEndDate = user.leavingDate
          ? new Date(user.leavingDate) < new Date(oneDayBeforedate)
            ? user.leavingDate
            : oneDayBeforedate
          : user.userMaster.deactiveDate
            ? new Date(user.userMaster.deactiveDate) <
              new Date(oneDayBeforedate)
              ? user.userMaster.deactiveDate
              : oneDayBeforedate
            : oneDayBeforedate;

        const attendanceQuery = {
          attributes: ['AttendanceDate'],
          where: {
            userMasterID: user.userMasterID,
            AttendanceDate: {
              [Op.between]: [fyStartDate, fyEndDate],
            },
            fulldayhalfday: {
              [Op.gt]: 0,
            },
          },
          distinct: true,
        };

        const weekoffHolidayQuery = {
          attributes: ['date'],
          where: {
            userMasterID: user.userMasterID,
            date: {
              [Op.between]: [fyStartDate, fyEndDate],
            },
            [Sequelize.Op.or]: [
              { optionalHoliday: false },
              { optionalHoliday: null },
            ],
          },
          distinct: true,
        };

        // Use Promise.all to fetch data concurrently
        const [uniqueDatesFromAttendance, uniqueDatesFromWeekoffHoliday] =
          await Promise.all([
            attendanceTransaction.findAll(attendanceQuery),
            weekoffHolidayTran.findAll(weekoffHolidayQuery),
          ]);

        // Extract unique dates from the results
        const uniqueDatesFromAttendanceSet = new Set(
          uniqueDatesFromAttendance.map((item) => item.AttendanceDate)
        );
        const uniqueDatesFromWeekoffHolidaySet = new Set(
          uniqueDatesFromWeekoffHoliday.map((item) => item.date)
        );

        // Combine the unique dates
        const combinedUniqueDates = [
          ...uniqueDatesFromAttendanceSet,
          ...uniqueDatesFromWeekoffHolidaySet,
        ];

        // get all date from date to todate

        const datesArray = await getDatesFromDateRange(
          new Date(fyStartDate),
          new Date(fyEndDate)
        );

        const formatedDate = datesArray.map((e) =>
          new Date(e).toISOString().slice(0, 10)
        );

        // remove dates from dates array

        const datesArray1 = formatedDate.filter(
          (date) => !combinedUniqueDates.includes(date)
        );

        const leavedata = userLeave.filter(
          (e) => e.userMasterID == user.userMasterID
        );

        // Remove dates from array1 that occur in the range of fromdate and todate in array2
        const filteredAbsent = datesArray1.filter(
          (date) =>
            !leavedata.some((obj) =>
              isDateInRange(date, obj.FromDate, obj.ToDate)
            )
        );

        // Sort array1 in ascending order
        const sortedArray1 = filteredAbsent.sort(
          (a, b) => new Date(a) - new Date(b)
        );

        const absentArray = await getFomatedData(sortedArray1, user);

        if (leavedata.length > 0 || absentArray.length > 0) {
          srno++;

          const approvedleave = await UserLeaveTransaction.findAll({
            raw: true,
            where: {
              date: {
                [Sequelize.Op.between]: [startDate, beforeEndDate],
              },
              status: 1,
            },
            include: [
              {
                model: UserLeave,
                where: { userMasterID: user.userMasterID },
                attributes: [],
              },
              {
                model: hrLeaveTypes,
                include: [
                  { model: HrLeaveMaster, as: 'LeaveMaster', attributes: [] },
                ],
                attributes: [],
              },
            ],
            group: [
              'userLeave.userMasterID',
              'userLeaveTransaction.LeaveTranId',
              'hrLeaveType.LeaveMaster.LeaveName',
            ],
            attributes: [
              [Sequelize.col('userLeave.userMasterID'), 'userMasterID'],
              [Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'), 'LeaveName'],
              [
                Sequelize.fn('SUM', Sequelize.literal('COALESCE("days", 0)')),
                'totalDays',
              ],
            ],
          });

          // to get financial data

          const fyStartDate1 =
            new Date(user.joiningDate) > new Date(startDate)
              ? user.joiningDate
              : startDate;
          const fyEndDate1 = user.leavingDate
            ? new Date(user.leavingDate) < new Date(oneDayBeforedate)
              ? user.leavingDate
              : oneDayBeforedate
            : user.userMaster.deactiveDate
              ? new Date(user.userMaster.deactiveDate) <
                new Date(oneDayBeforedate)
                ? user.userMaster.deactiveDate
                : oneDayBeforedate
              : oneDayBeforedate;

          const [attendance, weekoffholiday, leavedata1] = await Promise.all([
            attendanceTransaction.findAll({
              raw: true,
              where: {
                userMasterID: user.userMasterID,
                AttendanceDate: {
                  [Sequelize.Op.between]: [fyStartDate1, fyEndDate1],
                },
              },

              attributes: [
                [
                  Sequelize.fn(
                    'SUM',
                    Sequelize.literal('COALESCE("fulldayhalfday", 0)')
                  ),
                  'days',
                ],
                [
                  Sequelize.fn(
                    'SUM',
                    Sequelize.literal(
                      `CASE WHEN "LateBy" <> '' THEN 1 ELSE 0 END`
                    )
                  ),
                  'lateDays',
                ],
                [
                  Sequelize.fn(
                    'SUM',
                    Sequelize.literal(
                      `CASE WHEN "EarlyBy" <> '' THEN 1 ELSE 0 END`
                    )
                  ),
                  'earlyDays',
                ],
              ],
            }),

            weekoffHolidayTran.findAll({
              raw: true,
              where: {
                userMasterID: user.userMasterID,
                date: {
                  [Sequelize.Op.between]: [fyStartDate1, fyEndDate1],
                },
                [Sequelize.Op.or]: [
                  { optionalHoliday: false },
                  { optionalHoliday: null },
                ],
              },
              attributes: [
                [
                  Sequelize.fn(
                    'SUM',
                    Sequelize.literal('COALESCE("value", 0)')
                  ),
                  'days',
                ],
              ],
            }),

            UserLeave.findAll({
              raw: true,
              where: {
                userMasterID: user.userMasterID,
                status: 1,
                FromDate: { [Sequelize.Op.lte]: fyEndDate1 },
                ToDate: { [Sequelize.Op.gte]: fyStartDate1 },
              },
              attributes: [
                [
                  Sequelize.fn(
                    'SUM',
                    Sequelize.literal('COALESCE("LeaveDays", 0)')
                  ),
                  'days',
                ],
              ],
            }),
          ]);

          const totalDays =
            (new Date(fyEndDate1) - new Date(fyStartDate1)) /
            (1000 * 60 * 60 * 24);

          const finalAbsentDays =
            +totalDays -
            (attendance.length > 0 ? +attendance[0].days : 0) -
            (weekoffholiday.length > 0 ? +weekoffholiday[0].days : 0) -
            (leavedata1.length > 0 ? +leavedata1[0].days : 0);

          const lC_Eg =
            attendance.length > 0
              ? +attendance[0].lateDays + +attendance[0].earlyDays
              : 0;

          const department =
            user.userMaster.employeeDepartments &&
            user.userMaster.employeeDepartments.length > 0
              ? user.userMaster.employeeDepartments[0]
              : null;

          const result = {};

          leaveHeader.forEach((value) => {
            const foundItem = approvedleave.find(
              (item) => item.LeaveName == value
            );
            result[value] = foundItem ? foundItem.totalDays : '';
          });

          // merge both array

          const data = [...leavedata, ...absentArray];

          data.map((c) => {
            const data = {
              SrNo: srno,
              displayName: c.displayName,
              department: department
                ? department.department.departmentName
                : '',
              FromDate: getDDMMYYYYdate(c.FromDate),
              toDate: getDDMMYYYYdate(c.ToDate),
              authorizationStatus:
                c.authorizationStatus == 3
                  ? 'Accepted'
                  : c.authorizationStatus == 'Absent'
                    ? 'Absent'
                    : 'Pending',
              days: c.LeaveDays,
            };

            const finalObject = { ...data, ...result };

            finalObject['finalAbsentDays'] =
              +finalAbsentDays > 0 ? finalAbsentDays : 0;
            finalObject['lCEG'] = lC_Eg;

            if (user.salarytype == 'S') {
              salaryTypeStaff.push(finalObject);
            } else if (user.salarytype == 'W') {
              salaryTypeWages.push(finalObject);
            } else {
              SalatTypeNotSet.push(finalObject);
            }
          });
        }
      }

      const arraysToCheck = [salaryTypeStaff, salaryTypeWages, SalatTypeNotSet];

      for (const array of arraysToCheck) {
        if (array.length > 0) {
          final.push(array);
        }
      }

      if (+final.length === 0 && sendmail == false) {
        return res.status(200).json({
          message: 'No data found to export!',
        });
      }

      await generateExcelForLeave(
        final,
        firstHeader,
        leaveHeader,
        compid,
        sendmail,
        oneDayBeforedate,
        'FY Wise Leave Report' + `${oneDayBeforedate}`,
        'xlsx',
        res,
        ['Staff', 'Wages', 'Others']
      );
    }

    if (sendmail == true) {
      return res.status(200).json({
        status: 200,
        message: 'Mail sent successfully.',
      });
    }
    return;
  } catch (err) {
    next(err);
  }
};

exports.AttendanceReportMain = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      generateExcelFile,
      exportFileType,
      userMasterID,
      user,
      fromdate,
      todate,
    } = req.body;
    const userMasterID1 =
      userMasterID && userMasterID.length ? userMasterID : [];
    const paginate =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    if (userMasterID1 && userMasterID1.length == 0) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Users Not Found'),
      });
    }
    const getUserDataDate = asiaKolkataDateTime(
      new Date(req.body.todate)
    ).slice(0, 10);
    const { rows: users, count: totalcount } = await UserMaster.findAndCountAll(
      {
        where: {
          userMasterID: userMasterID1,
        },
        ...paginate,
        include: [
          {
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode', 'joiningDate', 'leavingDate'],
          },
          {
            required: false,
            model: EmployeeBranch,
            where: {
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date(getUserDataDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(getUserDataDate) } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
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
            model: EmployeeDesignation,
            where: {
              status: 1,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(getUserDataDate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: { [Sequelize.Op.gte]: new Date(getUserDataDate) },
                },
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
              applicableDate: {
                [Sequelize.Op.lte]: new Date(getUserDataDate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: { [Sequelize.Op.gte]: new Date(getUserDataDate) },
                },
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
            model: EmployeeDivision,
            where: {
              status: 1,
              startDate: { [Sequelize.Op.lte]: getUserDataDate },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: getUserDataDate } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },

            attributes: ['divisionId', 'startDate'],
            include: [
              {
                model: Division,
                attributes: ['divisionName'],
              },
            ],
          },
          {
            required: false,
            model: EmployeeWorkingArea,
            where: {
              status: 1,
              startDate: { [Sequelize.Op.lte]: getUserDataDate },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: getUserDataDate } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            attributes: ['workingAreaId', 'startDate'],
            include: [
              {
                model: WorkingArea,
                attributes: ['workingAreaName'],
              },
            ],
          },
          // Employee project
          {
            required: false,
            model: EmployeeProject,
            where: {
              startDate: {
                [Sequelize.Op.lte]: getUserDataDate,
              },
              [Sequelize.Op.or]: [
                {
                  releaseDate: {
                    [Sequelize.Op.gte]: getUserDataDate,
                  },
                },
                {
                  releaseDate: {
                    [Sequelize.Op.eq]: null,
                  },
                },
              ],
            },
            attributes: ['projectID', 'startDate', 'releaseDate'],
            include: [
              {
                model: Project,

                attributes: ['projectID', 'projectName'],
              },
            ],
          },
        ],
        order: [['displayName', 'ASC']],
        attributes: ['userMasterID', 'displayName', 'userNumber'],
      }
    );

    const alluserIds = users.map((e) => e.userMasterID);

    const allUserAttendance = await attendanceTransaction.findAll({
      raw: true,
      where: {
        AttendanceDate: {
          [Sequelize.Op.between]: [
            new Date(req.body.fromdate),
            new Date(req.body.todate),
          ],
        },
        userMasterID: alluserIds,
      },
      order: [['AttendanceDate', 'ASC']],
      include: [
        { model: BranchMaster, attributes: ['branchName'] },
        { model: Department, attributes: ['departmentName'] },
        { model: Designation, attributes: ['designationName'] },
        { model: Shift, attributes: ['shiftName'] },
        {
          required: false,
          model: overTimeCalculation,
          attributes: ['OverTimeHourAndMin'],
        },
      ],
    });

    const allUserLeaves = await UserLeaves.findAll({
      where: {
        status: 1,
        [Sequelize.Op.or]: [
          {
            FromDate: {
              [Sequelize.Op.lte]: fromdate,
            },
            ToDate: {
              [Sequelize.Op.gte]: fromdate,
            },
          },
          {
            FromDate: {
              [Sequelize.Op.lte]: todate,
            },
            ToDate: {
              [Sequelize.Op.gte]: todate,
            },
          },
          {
            FromDate: {
              [Sequelize.Op.gte]: fromdate,
            },
            ToDate: {
              [Sequelize.Op.lte]: todate,
            },
          },
        ],
        userMasterID: alluserIds,
        authorizationStatus: { [Sequelize.Op.ne]: 4 },
        [Sequelize.Op.and]: [
          {
            [Sequelize.Op.or]: [
              {
                [Sequelize.Op.and]: [
                  Sequelize.where(
                    Sequelize.literal(`
                      NOT EXISTS (
                        SELECT 1 
                        FROM "userLeaveTransactions" AS "ult" 
                        WHERE "ult"."ReferenceID" = "userLeave"."UserLeaveApplicationID" 
                        AND "ult"."status" = 1
                      )
                    `)
                  ),
                  Sequelize.where(
                    Sequelize.col('userLeave.authorizationStatus'),
                    Sequelize.Op.eq,
                    3
                  ),
                ],
              },
              {
                [Sequelize.Op.and]: [
                  Sequelize.where(
                    Sequelize.col('userLeave.authorizationStatus'),
                    Sequelize.Op.ne,
                    3
                  ),
                ],
              },
            ],
          },
        ],
      },
      order: [['FromDate', 'ASC']],
      include: {
        model: UserLeaveTransaction,
        required: false,
        where: { status: 1 },
        include: {
          model: hrLeaveTypes,
          attributes: ['LeaveID'],
          include: {
            model: HrLeaveMaster,
            as: 'LeaveMaster',
            attributes: ['LeaveName'],
          },
        },
      },
    });

    const allUserWeekOffHoliday = await weekoffHolidayTran.findAll({
      raw: true,
      where: {
        date: {
          [Sequelize.Op.between]: [
            new Date(req.body.fromdate),
            new Date(req.body.todate),
          ],
        },
        userMasterID: alluserIds,
        [Sequelize.Op.and]: Sequelize.literal(`(date, "tableName") IN (
          SELECT date, MAX("tableName") AS max_tableName
          FROM "weekoffHolidayTrans"
          WHERE "userMasterID" in (${alluserIds.join(',')})
            AND date BETWEEN '${req.body.fromdate}' AND '${
              req.body.todate
            }' AND ("optionalHoliday" IS FALSE OR  "optionalHoliday" IS null)
          GROUP BY date
        )`),
      },
      order: [
        ['date', 'ASC'],
        ['tableName', 'DESC'],
      ],
    });

    const final = await Promise.all(
      users.map(async (user) => {
        let start_date = req.body.fromdate;
        let end_date = req.body.todate;

        if (user?.employeeJoiningDetails?.[0]?.joiningDate) {
          if (
            new Date(user?.employeeJoiningDetails?.[0]?.joiningDate) >
            new Date(req.body.fromdate)
          ) {
            start_date = user?.employeeJoiningDetails?.[0]?.joiningDate;
          }
          if (user?.employeeJoiningDetails?.[0]?.leavingDate) {
            if (
              new Date(user?.employeeJoiningDetails?.[0]?.leavingDate) <
              new Date(req.body.todate)
            ) {
              end_date = user?.employeeJoiningDetails?.[0]?.leavingDate;
            }
          }
        }

        const datesArray = await getDatesFromDateRange(
          new Date(req.body.fromdate),
          new Date(req.body.todate)
        );
        const userProjects = user?.employeeProjects ?? [];
        const projectNameArray = userProjects.map(
          ({ project }) => project?.projectName ?? ''
        );
        let userData = {
          employeecode: user?.employeeJoiningDetails?.[0]?.employeeCode || '-',
          userMasterID: user.userMasterID,
          userName: user.displayName,
          userNumber: user.userNumber,
          branch: user?.employeeBranches?.[0]?.branchMaster?.branchName || '-',
          department:
            user.employeeDepartments?.[0]?.department?.departmentName || '-',
          designation:
            user?.employeeDesignations?.[0]?.designation?.designationName ||
            '-',
          division: user?.employeeDivisions?.[0]?.division.divisionName || '-',
          workingArea:
            user?.employeeWorkingAreas?.[0]?.workingArea?.workingAreaName ||
            '-',
          project: projectNameArray.join(',') || '',
          totalabsentday: 0,
          totalhalfday: 0,
          totalpresentday: 0,
          totalmisspunch: 0,
          totalweekoffholiday: 0,
          totalapprovedleave: 0,
          totalpendingleave: 0,
          attendancedata: [],
        };

        const allAttendance = allUserAttendance.filter((attendance) => {
          return (
            attendance.userMasterID == user.userMasterID &&
            new Date(attendance.AttendanceDate) >= new Date(start_date) &&
            new Date(attendance.AttendanceDate) <= new Date(end_date)
          );
        });

        const allWeekOffHoliday = allUserWeekOffHoliday.filter(
          (weekoffholiday) => {
            return (
              weekoffholiday.userMasterID == user.userMasterID &&
              new Date(weekoffholiday.date) >= new Date(start_date) &&
              new Date(weekoffholiday.date) <= new Date(end_date)
            );
          }
        );

        const allLeaves = allUserLeaves.filter((leaves) => {
          return leaves.userMasterID == user.userMasterID;
        });

        let logdata = [];

        if (+generateExcelFile == 6 || +generateExcelFile == 7) {
          const tranIds = allAttendance.map((e) => e.AttendanceTransID);

          if (+tranIds.length > 0)
            logdata = await AttendanceLogs.findAll({
              raw: true,
              where: {
                AttendanceTransID: {
                  [Sequelize.Op.in]: tranIds,
                },
              },
              order: [['logDateTime', 'ASC']],
              attributes: ['logDateTime', 'direction', 'AttendanceTransID'],
            });
        }

        for (const date of datesArray) {
          let currentDateData = {
            attendancedate: date.toISOString().slice(0, 10),
            attendancetype: 'A',
            intime: '-',
            outtime: '-',
            minutes: '-',
            shift: '-',
            shiftHours: '-',
            shiftInTime: '-',
            shiftOutTime: '-',
            Lateby: '-',
            EarlyBy: '-',
            Penalty: '-',
            goEarlyPanalty: '-',
            goEarlyPanaltyDeduction: '-',
            latePenaltyMinutes: '-',
            earlyPenaltyMinutes: '-',
            PenaltyDeduction: '-',
            GoEarlyUsed: '-',
            employeecode: userData.employeecode,
            userName: userData.userName,
            userNumber: userData.userNumber,
            branch: userData.branch,
            department: userData.department,
            designation: userData.designation,
            division: userData.division,
            workingArea: userData.workingArea,
            project: userData.project,
            finalminutes: 0,
            logData: [],
            otMinutes: 0,
            outMinutes: 0,
          };

          if (
            new Date(start_date) <= new Date(date) &&
            new Date(end_date) >= new Date(date)
          ) {
            let flag = 0;

            if (
              allAttendance.length != 0 &&
              allAttendance[0].AttendanceDate ==
                new Date(date).toISOString().slice(0, 10)
            ) {
              // to get log

              if (+generateExcelFile == 6 || +generateExcelFile == 7) {
                const attlog = logdata.filter(
                  (e) =>
                    e.AttendanceTransID == allAttendance[0].AttendanceTransID
                );

                currentDateData.logData = attlog.map(
                  (e) =>
                    `${new Date(e.logDateTime).toLocaleString()} - ${
                      e.direction
                    }`
                );
              }

              const ot =
                allAttendance[0]['OverTimeCalculations.OverTimeHourAndMin'] ||
                0;

              if (+allAttendance[0].fulldayhalfday == 1) {
                userData.totalpresentday++;
                currentDateData.attendancetype = 'P';
                if (
                  allAttendance[0].latePenaltyMinutes ||
                  allAttendance[0].PanaltyDeduction
                )
                  currentDateData.attendancetype += '+LC';
                if (
                  allAttendance[0].earlyPenaltyMinutes ||
                  allAttendance[0].goEarlyPanaltyDeduction
                )
                  currentDateData.attendancetype += '+EG';
                currentDateData.minutes = await toHoursAndMinutes(
                  +allAttendance[0].InHrs + +allAttendance[0].OutHrs
                );
                (currentDateData.intime = allAttendance[0].InDatetime),
                  (currentDateData.outtime = allAttendance[0].OutDateTime),
                  (currentDateData.shift = allAttendance[0]['shift.shiftName']
                    ? allAttendance[0]['shift.shiftName']
                    : '-'),
                  (currentDateData.shiftHours = allAttendance[0].Shifthrs
                    ? allAttendance[0].Shifthrs
                    : '-'),
                  (currentDateData.shiftInTime = allAttendance[0].ShiftIntime
                    ? allAttendance[0].ShiftIntime
                    : '-'),
                  (currentDateData.shiftOutTime = allAttendance[0].ShiftoutTime
                    ? allAttendance[0].ShiftoutTime
                    : '-'),
                  (currentDateData.Lateby = allAttendance[0].LateBy
                    ? allAttendance[0].LateBy
                    : '-'),
                  (currentDateData.EarlyBy = allAttendance[0].EarlyBy
                    ? allAttendance[0].EarlyBy
                    : '-'),
                  (currentDateData.Penalty = allAttendance[0].Panalty
                    ? allAttendance[0].Panalty
                    : '-'),
                  (currentDateData.goEarlyPanalty = allAttendance[0]
                    .goEarlyPanalty
                    ? allAttendance[0].goEarlyPanalty
                    : '-'),
                  (currentDateData.goEarlyPanaltyDeduction = allAttendance[0]
                    .goEarlyPanaltyDeduction
                    ? allAttendance[0].goEarlyPanaltyDeduction
                    : '-'),
                  (currentDateData.latePenaltyMinutes = allAttendance[0]
                    .latePenaltyMinutes
                    ? allAttendance[0].latePenaltyMinutes
                    : '-'),
                  (currentDateData.earlyPenaltyMinutes = allAttendance[0]
                    .earlyPenaltyMinutes
                    ? allAttendance[0].earlyPenaltyMinutes
                    : '-'),
                  (currentDateData.PenaltyDeduction = allAttendance[0]
                    .PanaltyDeduction
                    ? allAttendance[0].PanaltyDeduction
                    : '-'),
                  (currentDateData.employeecode = userData.employeecode),
                  (currentDateData.userName = userData.userName),
                  (currentDateData.userNumber = userData.userNumber),
                  (currentDateData.finalminutes =
                    +allAttendance[0].InHrs + +allAttendance[0].OutHrs);
                currentDateData.outMinutes = +allAttendance[0].OutHrs;
                currentDateData.otMinutes = +ot;
              } else if (+allAttendance[0].fulldayhalfday == 0.5) {
                userData.totalhalfday++;
                currentDateData.attendancetype = 'HD';
                currentDateData.minutes = await toHoursAndMinutes(
                  +allAttendance[0].InHrs + +allAttendance[0].OutHrs
                );
                (currentDateData.intime = allAttendance[0].InDatetime),
                  (currentDateData.outtime = allAttendance[0].OutDateTime),
                  (currentDateData.shift = allAttendance[0]['shift.shiftName']
                    ? allAttendance[0]['shift.shiftName']
                    : '-'),
                  (currentDateData.shiftHours = allAttendance[0].Shifthrs
                    ? allAttendance[0].Shifthrs
                    : '-'),
                  (currentDateData.shiftInTime = allAttendance[0].ShiftIntime
                    ? allAttendance[0].ShiftIntime
                    : '-'),
                  (currentDateData.shiftOutTime = allAttendance[0].ShiftoutTime
                    ? allAttendance[0].ShiftoutTime
                    : '-'),
                  (currentDateData.Lateby = allAttendance[0].LateBy
                    ? allAttendance[0].LateBy
                    : '-'),
                  (currentDateData.EarlyBy = allAttendance[0].EarlyBy
                    ? allAttendance[0].EarlyBy
                    : '-'),
                  (currentDateData.Penalty = allAttendance[0].Panalty
                    ? allAttendance[0].Panalty
                    : '-'),
                  (currentDateData.goEarlyPanalty = allAttendance[0]
                    .goEarlyPanalty
                    ? allAttendance[0].goEarlyPanalty
                    : '-'),
                  (currentDateData.goEarlyPanaltyDeduction = allAttendance[0]
                    .goEarlyPanaltyDeduction
                    ? allAttendance[0].goEarlyPanaltyDeduction
                    : '-'),
                  (currentDateData.latePenaltyMinutes = allAttendance[0]
                    .latePenaltyMinutes
                    ? allAttendance[0].latePenaltyMinutes
                    : '-'),
                  (currentDateData.earlyPenaltyMinutes = allAttendance[0]
                    .earlyPenaltyMinutes
                    ? allAttendance[0].earlyPenaltyMinutes
                    : '-'),
                  (currentDateData.PenaltyDeduction = allAttendance[0]
                    .PanaltyDeduction
                    ? allAttendance[0].PanaltyDeduction
                    : '-'),
                  (currentDateData.employeecode = userData.employeecode),
                  (currentDateData.userName = userData.userName),
                  (currentDateData.userNumber = userData.userNumber),
                  (currentDateData.finalminutes =
                    +allAttendance[0].InHrs + +allAttendance[0].OutHrs);
                currentDateData.outMinutes = +allAttendance[0].OutHrs;
                currentDateData.otMinutes = +ot;
              } else if (
                !allAttendance[0].OutDateTime &&
                new Date().toISOString().slice(0, 10) !=
                  new Date(date).toISOString().slice(0, 10)
              )
                userData.totalmisspunch++,
                  (currentDateData.attendancetype = 'MissPunch'),
                  (currentDateData.intime = allAttendance[0].InDatetime);
              else if (
                !allAttendance[0].OutDateTime &&
                new Date().toISOString().slice(0, 10) ==
                  new Date(date).toISOString().slice(0, 10)
              )
                userData.totalpresentday++,
                  (currentDateData.attendancetype = 'P'),
                  (currentDateData.intime = allAttendance[0].InDatetime);
              else
                userData.totalabsentday++,
                  (currentDateData.attendancetype = 'A'),
                  (currentDateData.minutes = await toHoursAndMinutes(
                    +allAttendance[0].InHrs + +allAttendance[0].OutHrs
                  ));
              (currentDateData.intime = allAttendance[0].InDatetime),
                (currentDateData.outtime = allAttendance[0].OutDateTime
                  ? allAttendance[0].OutDateTime
                  : '-'),
                (currentDateData.shift = allAttendance[0]['shift.shiftName']
                  ? allAttendance[0]['shift.shiftName']
                  : '-'),
                (currentDateData.shiftHours = allAttendance[0].Shifthrs
                  ? allAttendance[0].Shifthrs
                  : '-'),
                (currentDateData.shiftInTime = allAttendance[0].ShiftIntime
                  ? allAttendance[0].ShiftIntime
                  : '-'),
                (currentDateData.shiftOutTime = allAttendance[0].ShiftoutTime
                  ? allAttendance[0].ShiftoutTime
                  : '-'),
                (currentDateData.Lateby = allAttendance[0].LateBy
                  ? allAttendance[0].LateBy
                  : '-'),
                (currentDateData.EarlyBy = allAttendance[0].EarlyBy
                  ? allAttendance[0].EarlyBy
                  : '-'),
                (currentDateData.Penalty = allAttendance[0].Panalty
                  ? allAttendance[0].Panalty
                  : '-'),
                (currentDateData.goEarlyPanalty = allAttendance[0]
                  .goEarlyPanalty
                  ? allAttendance[0].goEarlyPanalty
                  : '-'),
                (currentDateData.goEarlyPanaltyDeduction = allAttendance[0]
                  .goEarlyPanaltyDeduction
                  ? allAttendance[0].goEarlyPanaltyDeduction
                  : '-'),
                (currentDateData.latePenaltyMinutes = allAttendance[0]
                  .latePenaltyMinutes
                  ? allAttendance[0].latePenaltyMinutes
                  : '-'),
                (currentDateData.earlyPenaltyMinutes = allAttendance[0]
                  .earlyPenaltyMinutes
                  ? allAttendance[0].earlyPenaltyMinutes
                  : '-'),
                (currentDateData.PenaltyDeduction = allAttendance[0]
                  .PanaltyDeduction
                  ? allAttendance[0].PanaltyDeduction
                  : '-'),
                (currentDateData.employeecode = userData.employeecode),
                (currentDateData.userName = userData.userName),
                (currentDateData.userNumber = userData.userNumber),
                (currentDateData.finalminutes =
                  +allAttendance[0].InHrs + +allAttendance[0].OutHrs);
              currentDateData.outMinutes = +allAttendance[0].OutHrs;
              currentDateData.otMinutes = +ot;

              flag = 1;
              while (
                allAttendance.length != 0 &&
                allAttendance[0].AttendanceDate ==
                  new Date(date).toISOString().slice(0, 10)
              ) {
                allAttendance.shift();
              }
            }

            let weekOffDay = false;
            if (
              allWeekOffHoliday.length != 0 &&
              allWeekOffHoliday[0].date ==
                new Date(date).toISOString().slice(0, 10)
            ) {
              weekOffDay = true;
              if (allWeekOffHoliday[0].optionalHoliday)
                allWeekOffHoliday[0].tableName = 'Optional Holiday';

              if (flag == 1)
                currentDateData.attendancetype +=
                  '+' + allWeekOffHoliday[0].tableName;
              else {
                currentDateData.attendancetype = allWeekOffHoliday[0].tableName;
                userData.totalweekoffholiday++;
                flag = 1;
              }

              while (
                allWeekOffHoliday.length != 0 &&
                allWeekOffHoliday[0].date ==
                  new Date(date).toISOString().slice(0, 10)
              ) {
                allWeekOffHoliday.shift();
              }
            }

            const Leave = allLeaves.filter(
              (leave) =>
                new Date(date) >= new Date(leave.FromDate) &&
                new Date(date) <= new Date(leave.ToDate)
            );

            if (Leave.length) {
              let leaveName = null;

              if (
                Leave.find((e) => [0, 1, 2].includes(e.authorizationStatus))
              ) {
                leaveName = 'Leave';
              } else {
                const leaveTrans = Leave.flatMap(
                  (e) => e.userLeaveTransactions
                ).filter(
                  (a) => new Date(a.date).getTime() == new Date(date).getTime()
                );

                if (leaveTrans.length) {
                  leaveName = leaveTrans
                    .map((e) => e.hrLeaveType.LeaveMaster.LeaveName)
                    .join(',');
                }
              }

              // if (Leave.authorizationStatus == 3) {
              //   if (
              //     Leave.userLeaveTransactions &&
              //     Leave.userLeaveTransactions.length
              //   ) {
              //     const currLeave = Leave.userLeaveTransactions.find(
              //       (curr_Leave) => {
              //         return (
              //           new Date(curr_Leave.date).getTime() ==
              //           new Date(date).getTime()
              //         );
              //       }
              //     );
              //     if (currLeave)
              //       leaveName = currLeave.hrLeaveType.LeaveMaster.LeaveName;
              //     else leaveName = null;
              //   } else leaveName = null;
              // }

              if (leaveName) {
                if (flag == 1)
                  currentDateData.attendancetype += '+' + leaveName;
                else {
                  currentDateData.attendancetype = leaveName;

                  if (leaveName == 'Leave') userData.totalpendingleave++;
                  else userData.totalapprovedleave++;

                  flag = 1;
                }
              }
            }

            if (flag == 0) {
              userData.totalabsentday++;
            }
          } else {
            (currentDateData.attendancetype = '-'),
              (currentDateData.employeecode = '-'),
              (currentDateData.userName = '-'),
              (currentDateData.userNumber = '-');
          }

          userData.attendancedata.push(currentDateData);
        }
        if (
          userData.attendancedata.length != 0 &&
          (userData.attendancedata[0].branch == '-' ||
            userData.attendancedata[0].department == '-' ||
            userData.attendancedata[0].designation == '-')
        ) {
          if (userData.attendancedata[0].branch == '-') {
            const branch = await employeeBranch(
              userData.userMasterID,
              userData.attendancedata[0].attendancedate
            );

            if (branch)
              userData.attendancedata[0].branch =
                branch['branchMaster.branchName'];
          }
          if (userData.attendancedata[0].department == '-') {
            const department = await employeeDepartment(
              userData.userMasterID,
              userData.attendancedata[0].attendancedate
            );

            if (department)
              userData.attendancedata[0].department =
                department['department.departmentName'];
          }
          if (userData.attendancedata[0].designation == '-') {
            const designation = await employeeDesignation(
              userData.userMasterID,
              userData.attendancedata[0].attendancedate
            );

            if (designation)
              userData.attendancedata[0].designation =
                designation['designation.designationName'];
          }
        }

        return userData;
      })
    );

    if (generateExcelFile) {
      let FileName = 'Attendance-Report';
      if (+generateExcelFile == 1 || +generateExcelFile == 2)
        FileName = 'Attendance Register 1';
      else if (+generateExcelFile == 3 || +generateExcelFile == 4)
        FileName = 'Attendance Register 2';
      else if (+generateExcelFile == 5)
        FileName = 'Consolidate Attendance Register';
      else if (+generateExcelFile == 6 || +generateExcelFile == 7)
        FileName = 'Attendance Log Report';

      await generateAttendanceExcel(
        final,
        FileName,
        exportFileType,
        generateExcelFile,
        res
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      data: final,
      totalCount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDailyHourlyReport = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      userMasterID,
      startDate,
      endDate,
      exportData,
      exportFileType,
    } = await req.body;

    const paginationQuery = !exportData
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const userData = await UserMaster.findAll({
      distinct: true,
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
      },
      ...paginationQuery,
      include: [
        {
          required: false,
          model: attendanceTransaction,
          where: {
            AttendanceDate: {
              [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
            },
          },
        },
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
            applicableDate: { [Sequelize.Op.lte]: new Date(endDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(endDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
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
          model: EmployeeJoiningDetails,
          attributes: ['employeeCode'],
        },
      ],
      attributes: ['displayName', 'userNumber', 'userMasterID'],
      order: [['displayName', 'ASC']],
    });

    const datesArray = await getDatesFromDateRange(
      new Date(startDate),
      new Date(endDate)
    );
    const finalData = [];
    for (var user of userData) {
      const tempData = {};

      const allAttendance = user.attendanceTransactions || [];

      tempData['Employee Name'] = user.displayName;
      tempData['Employee Number'] = user.userNumber;
      tempData['Employee Code'] =
        user.employeeJoiningDetails?.[0]?.employeeCode || '';
      tempData['Employee Branch'] =
        user.employeeBranches?.[0]?.branchMaster?.branchName || '';
      tempData['Employee Department'] =
        user.employeeDepartments?.[0]?.department?.departmentName || '';
      tempData['Employee Designation'] =
        user.employeeDesignations?.[0]?.designation?.designationName || '';

      let totalDays = 0,
        totalHrs = 0;

      for (const date of datesArray) {
        const attendance = allAttendance.find(
          (e) =>
            new Date(e.AttendanceDate).getTime() == new Date(date).getTime()
        );

        if (!attendance) {
          tempData[
            new Date(date).toLocaleDateString('en-GB').replace(/\//g, '-')
          ] = 0;
          continue;
        }

        if (attendance.fulldayhalfday == 1 || attendance.fulldayhalfday == 0.5)
          totalDays++;

        tempData[
          new Date(attendance.AttendanceDate)
            .toLocaleDateString('en-GB')
            .replace(/\//g, '-')
        ] = await toHoursAndMinutes(+attendance.roundOffMinutes);
        totalHrs += +attendance.roundOffMinutes;
      }
      tempData['Total Days'] = totalDays;
      tempData['Total Hrs'] = await toHoursAndMinutes(+totalHrs);

      finalData.push(tempData);
    }

    if (exportData) {
      await generateExcel(
        finalData,
        'Daily Hourly Report',
        exportFileType,
        res
      );
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: finalData, totalcount: userMasterID.length });
  } catch (err) {
    next(err);
  }
};

exports.getPerDayCostDepartmentWise = async (req, res, next) => {
  try {
    let { companyMasterID, month } = req.query;

    const date =
      new Date().getFullYear() +
      '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + new Date().getDate()).slice(-2);

    if (month && month > date.slice(0, 4) + date.slice(5, 7)) {
      return res.status(200).json({
        status: 401,
        message: 'You can not select future month!',
      });
    }

    // let companyMasterID;
    let sendmail = false;

    if (companyMasterID) {
      companyMasterID = [companyMasterID];
    } else {
      sendmail = true;

      const allCompany = await RolePermission.findAll({
        raw: true,
        include: [
          { model: RoleMaster, attributes: [] },
          {
            model: FormMaster,
            where: { formName: 'DailyCostReport' },
            attributes: [],
          },
        ],
        attributes: [
          [Sequelize.col('roleMaster.roleMasterID'), 'roleMasterID'],
          [Sequelize.col('roleMaster.companyMasterID'), 'companyMasterID'],
        ],
      });

      const companyids = allCompany.map((item) => +item.companyMasterID);

      const findNotificationPolicy = await notificationPolicy.findAll({
        raw: true,
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyids,
          },
          status: 1,
        },
        attributes: [[Sequelize.col('companyMasterID'), 'companyMasterID']],
      });

      companyMasterID = findNotificationPolicy.map(
        (item) => +item.companyMasterID
      );
    }

    let oneDayBeforedate =
      new Date().getFullYear() +
      '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + (new Date().getDate() - 1)).slice(-2);

    if (month) {
      if (month < date.slice(0, 4) + date.slice(5, 7)) {
        oneDayBeforedate =
          month.slice(0, 4) +
          '-' +
          month.slice(4, 6) +
          '-' +
          daysInMonth(month.slice(4, 6), month.slice(0, 4));
      }
    }

    const month1 = oneDayBeforedate.slice(0, 4) + oneDayBeforedate.slice(5, 7);

    const startDate = oneDayBeforedate.slice(0, 8) + '01';
    const endDate =
      oneDayBeforedate.slice(0, 8) +
      daysInMonth(oneDayBeforedate.slice(5, 7), oneDayBeforedate.slice(0, 4));

    const headerMonth =
      month_dict[oneDayBeforedate.slice(5, 7)] +
      ' ' +
      oneDayBeforedate.slice(0, 4);

    const dates = await getDatesFromDateRange(
      new Date(startDate),
      new Date(endDate)
    );

    const daysInmonth = daysInMonth(
      oneDayBeforedate.slice(5, 7),
      oneDayBeforedate.slice(0, 4)
    );

    for (const compId of companyMasterID) {
      const department = await Department.findAll({
        where: {
          companyMasterID: compId,
          status: 1,
        },
      });

      const allShift = await Shift.findAll({
        where: {
          companyMasterID,
          status: 1,
        },
        include: [
          {
            required: false,
            model: shiftTime,
          },
        ],
      });

      const wagesfinalData = [],
        stafffinalData = [],
        otherfinalData = [];
      const datesArray = Array.from(
        { length: daysInmonth },
        (_, index) => index + 1
      );

      const departId = department.map((e) => e.departmentId);

      const employeeDepartment = await EmployeeDepartment.findAll({
        where: {
          departmentID: {
            [Sequelize.Op.in]: departId,
          },
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

      const allActiveUsersID = employeeDepartment.map((e) => e.userMasterID);

      const allUsers = await EmployeeJoiningDetails.findAll({
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(endDate),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(endDate) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(endDate),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          userMasterID: allActiveUsersID,
          '$userMaster.status$': 1,
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
            include: [
              {
                model: EmployeeAttendancePolicy,
                where: {
                  status: 1,
                  startDate: {
                    [Sequelize.Op.lte]: new Date(endDate),
                  },
                  [Sequelize.Op.or]: [
                    {
                      endDate: {
                        [Sequelize.Op.gte]: new Date(endDate),
                      },
                    },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                attributes: ['attendancePolicyID'],
                required: false,
                include: [{ model: AttendancePolicy, as: 'attendancePolicy' }],
              },
              {
                model: EmployeeShift,
                where: {
                  status: 1,
                  startDate: {
                    [Sequelize.Op.lte]: new Date(endDate),
                  },
                  [Sequelize.Op.or]: [
                    {
                      endDate: {
                        [Sequelize.Op.gte]: new Date(endDate),
                      },
                    },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: false,
              },
            ],
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });

      allUsers.forEach((row) => {
        const deptData = employeeDepartment.find(
          (user) => user.userMasterID === row.userMasterID
        );
        if (deptData) {
          row.departmentId = deptData.departmentID;
        }
      });

      const allUsersId = allUsers.map((e) => e.userMasterID);

      const usersalaryData = [];

      const [weekOffs, attendanceData, overtimeData, leaveData] =
        await Promise.all([
          weekoffHolidayTran.findAll({
            where: {
              userMasterID: {
                [Sequelize.Op.in]: allUsersId,
              },
              date: {
                [Sequelize.Op.between]: [startDate, endDate],
              },
              [Sequelize.Op.or]: [
                { optionalHoliday: false },
                { optionalHoliday: null },
              ],
            },
          }),

          attendanceTransaction.findAll({
            where: {
              userMasterID: {
                [Sequelize.Op.in]: allUsersId,
              },
              AttendanceDate: {
                [Sequelize.Op.between]: [startDate, endDate],
              },
            },
          }),
          overTimeCalculation.findAll({
            where: {
              UserMasterID: {
                [Sequelize.Op.in]: allUsersId,
              },
              OverTimeDate: {
                [Sequelize.Op.between]: [startDate, endDate],
              },
              AuthorizationRequired: 3,
            },
          }),

          UserLeaveTransaction.findAll({
            where: {
              date: {
                [Sequelize.Op.between]: [startDate, endDate],
              },
              status: 1,
            },
            include: [
              {
                required: true,
                model: UserLeave,
                where: {
                  userMasterID: allUsersId,
                  authorizationStatus: 3,
                  status: 1,
                },
              },
            ],
          }),
        ]);

      for (const dep of department) {
        const otherfinalAmount = [],
          wagesfinalAmount = [],
          stafffinalAmount = [];

        const Wagesfinal = {
          department: dep.departmentName,
          amount: wagesfinalAmount,
        };
        const stafffinal = {
          department: dep.departmentName,
          amount: stafffinalAmount,
        };
        const otherfinal = {
          department: dep.departmentName,
          amount: otherfinalAmount,
        };

        const users = allUsers.filter(
          (e) => e.departmentId == dep.departmentId
        );

        for (const date of dates) {
          // let totalSalaryAmount = 0;
          let totalWagesSalaryAmount = 0,
            totalStaffSalaryAmount = 0,
            totalOtherAmount = 0;
          const currentDate = date.toISOString().slice(0, 10);

          if (new Date(currentDate) <= new Date(oneDayBeforedate)) {
            const final = await Promise.all(
              users.map(async (user) => {
                const usersalarystoredata = usersalaryData.find(
                  (e) => e.userId == user.userMasterID
                );

                let gross = 0,
                  salaryStructureType;

                if (usersalarystoredata) {
                  gross = +usersalarystoredata.grossAmount;
                  salaryStructureType = usersalarystoredata.salaryStructureType;
                } else {
                  const usersalary = await getUserSalaryMasterByMonth(
                    user.userMasterID,
                    month1
                  );

                  if (+usersalary.length > 0) {
                    gross =
                      usersalary.find((e) => e.payheadMasterId == 50)
                        ?.EmployeeSalaryAmount || 0;

                    salaryStructureType = usersalary[0].baseOnCalculation;

                    usersalaryData.push({
                      userId: user.userMasterID,
                      grossAmount: +gross,
                      salaryStructureType: salaryStructureType,
                    });
                  }
                }

                if (+gross > 0) {
                  let todivideSalary = daysInmonth;

                  if (user.salaryCalculationAct == 'F') {
                    const userWeekOffSum = weekOffs
                      .filter(
                        (e) =>
                          e.userMasterID == user.userMasterID &&
                          e.tableName == 'weekoff'
                      )
                      .reduce((acc, obj) => acc + +obj.value, 0);

                    todivideSalary = +todivideSalary - +userWeekOffSum;
                  }

                  let todividePerdaysalary = 0;

                  const userWeekoff = weekOffs.find(
                    (e) =>
                      e.userMasterID == user.userMasterID &&
                      e.date == currentDate
                  );

                  const attendancePolicy =
                    user.userMaster.employeeAttendancePolicies &&
                    user.userMaster.employeeAttendancePolicies.length > 0
                      ? user.userMaster.employeeAttendancePolicies[0]
                          .attendancePolicy
                      : null;

                  if (attendancePolicy) {
                    todividePerdaysalary = +attendancePolicy.overtimeHrs;
                  }

                  if (
                    salaryStructureType == 'M' ||
                    salaryStructureType == 'D'
                  ) {
                    let oneDaySalary =
                      salaryStructureType == 'M'
                        ? +gross / +todivideSalary
                        : salaryStructureType == 'D'
                          ? +gross
                          : 0;

                    if (userWeekoff) {
                      if (user.salaryCalculationAct == 'S') {
                        if (user.salarytype == 'W')
                          totalWagesSalaryAmount +=
                            +userWeekoff.value * +oneDaySalary;
                        else if (user.salarytype == 'S')
                          totalStaffSalaryAmount +=
                            +userWeekoff.value * +oneDaySalary;
                        else
                          totalOtherAmount +=
                            +userWeekoff.value * +oneDaySalary;
                      }
                    } else {
                      const attendance = attendanceData.find(
                        (e) =>
                          e.userMasterID == user.userMasterID &&
                          e.AttendanceDate == currentDate
                      );

                      if (user.salarytype == 'W')
                        totalWagesSalaryAmount += attendance
                          ? +attendance.fulldayhalfday * +oneDaySalary
                          : 0;
                      else if (user.salarytype == 'S')
                        totalStaffSalaryAmount += attendance
                          ? +attendance.fulldayhalfday * +oneDaySalary
                          : 0;
                      else
                        totalOtherAmount += attendance
                          ? +attendance.fulldayhalfday * +oneDaySalary
                          : 0;
                    }

                    const perminuteSalary =
                      +todividePerdaysalary > 0
                        ? +oneDaySalary / +todividePerdaysalary
                        : +oneDaySalary / 480;

                    const ot = overtimeData.find(
                      (e) =>
                        e.UserMasterID == user.userMasterID &&
                        e.OverTimeDate == currentDate
                    );

                    if (user.salarytype == 'W')
                      totalWagesSalaryAmount += ot
                        ? +ot.UpdateOverTimeHourAndMin * +perminuteSalary
                        : 0;
                    else if (user.salarytype == 'S')
                      totalStaffSalaryAmount += ot
                        ? +ot.UpdateOverTimeHourAndMin * +perminuteSalary
                        : 0;
                    else
                      totalOtherAmount += ot
                        ? +ot.UpdateOverTimeHourAndMin * +perminuteSalary
                        : 0;

                    const leave = leaveData
                      .filter(
                        (e) =>
                          e.userLeave.userMasterID == user.userMasterID &&
                          e.date == currentDate
                      )
                      .reduce((acc, obj) => acc + +obj.days, 0);

                    if (user.salarytype == 'W')
                      totalWagesSalaryAmount += +leave * +oneDaySalary;
                    else if (user.salarytype == 'S')
                      totalStaffSalaryAmount += +leave * +oneDaySalary;
                    else totalOtherAmount += +leave * +oneDaySalary;
                  }

                  if (salaryStructureType == 'H') {
                    let onedaysalary = 0;

                    const userShift =
                      user.userMaster.employeeShifts &&
                      user.userMaster.employeeShifts.length > 0
                        ? user.userMaster.employeeShifts[0]
                        : null;

                    let day = new Date(date).toLocaleString('en-us', {
                      weekday: 'long',
                    });

                    if (userShift) {
                      const shiftData = allShift.find(
                        (e) => e.shiftID == userShift.shiftsID[0]
                      );
                      if (shiftData) {
                        const shift =
                          shiftData.shiftTimes &&
                          shiftData.shiftTimes.length > 0
                            ? shiftData.shiftTimes.find((e) => e.day == day)
                            : null;
                        if (shift) onedaysalary = +shift.shiftHrs * +gross;
                      }
                    }

                    if (userWeekoff) {
                      if (user.salaryCalculationAct == 'S') {
                        if (user.salarytype == 'W')
                          totalWagesSalaryAmount +=
                            +userWeekoff.value * +onedaysalary;
                        else if (user.salarytype == 'S')
                          totalStaffSalaryAmount +=
                            +userWeekoff.value * +onedaysalary;
                        else
                          totalOtherAmount +=
                            +userWeekoff.value * +onedaysalary;
                      }
                    } else {
                      const attendance = attendanceData.find(
                        (e) =>
                          e.userMasterID == user.userMasterID &&
                          e.AttendanceDate == currentDate
                      );

                      if (user.salarytype == 'W')
                        totalWagesSalaryAmount += attendance
                          ? +attendance.InHrs * (+gross / 60)
                          : 0;
                      else if (user.salarytype == 'S')
                        totalStaffSalaryAmount += attendance
                          ? +attendance.InHrs * (+gross / 60)
                          : 0;
                      else
                        totalOtherAmount += attendance
                          ? +attendance.InHrs * (+gross / 60)
                          : 0;

                      const leave = leaveData
                        .filter(
                          (e) =>
                            e.userLeave.userMasterID == user.userMasterID &&
                            e.date == currentDate
                        )
                        .reduce((acc, obj) => acc + +obj.days, 0);

                      if (user.salarytype == 'W')
                        totalWagesSalaryAmount += +leave * +onedaysalary;
                      else if (user.salarytype == 'S')
                        totalStaffSalaryAmount += +leave * +onedaysalary;
                      else totalOtherAmount += +leave * +onedaysalary;
                    }
                  }
                }
                return;
              })
            );

            totalWagesSalaryAmount = totalWagesSalaryAmount
              ? Number.isInteger(+totalWagesSalaryAmount)
                ? +(+totalWagesSalaryAmount).toFixed(0)
                : +(+totalWagesSalaryAmount) % 1 === 0.2
                  ? +(+totalWagesSalaryAmount).toFixed(1)
                  : +(+totalWagesSalaryAmount).toFixed(2)
              : 0;

            totalStaffSalaryAmount = totalStaffSalaryAmount
              ? Number.isInteger(+totalStaffSalaryAmount)
                ? +(+totalStaffSalaryAmount).toFixed(0)
                : +(+totalStaffSalaryAmount) % 1 === 0.2
                  ? +(+totalStaffSalaryAmount).toFixed(1)
                  : +(+totalStaffSalaryAmount).toFixed(2)
              : 0;

            totalOtherAmount = totalOtherAmount
              ? Number.isInteger(+totalOtherAmount)
                ? +(+totalOtherAmount).toFixed(0)
                : +(+totalOtherAmount) % 1 === 0.2
                  ? +(+totalOtherAmount).toFixed(1)
                  : +(+totalOtherAmount).toFixed(2)
              : 0;
          }
          wagesfinalAmount.push(totalWagesSalaryAmount);
          stafffinalAmount.push(totalStaffSalaryAmount);
          otherfinalAmount.push(totalOtherAmount);
        }

        wagesfinalData.push(Wagesfinal);
        stafffinalData.push(stafffinal);
        otherfinalData.push(otherfinal);
      }

      const finalData = [];

      finalData.push(wagesfinalData, stafffinalData, otherfinalData);

      if (+finalData.length === 0) {
        return res.status(200).json({
          message: 'No data found to export!',
        });
      }

      const wagessumArray = Array.from(
        { length: wagesfinalData[0].amount.length },
        () => 0
      );

      // Calculate the sum of amounts index-wise
      wagesfinalData.forEach((department) => {
        department.amount.forEach((amount, index) => {
          wagessumArray[index] += amount;
        });
      });

      const staffsumArray = Array.from(
        { length: stafffinalData[0].amount.length },
        () => 0
      );

      // Calculate the sum of amounts index-wise
      stafffinalData.forEach((department) => {
        department.amount.forEach((amount, index) => {
          staffsumArray[index] += amount;
        });
      });

      const othersumArray = Array.from(
        { length: otherfinalData[0].amount.length },
        () => 0
      );

      // Calculate the sum of amounts index-wise
      otherfinalData.forEach((department) => {
        department.amount.forEach((amount, index) => {
          othersumArray[index] += amount;
        });
      });

      await generateExcelForDailyCost(
        headerMonth,
        datesArray,
        finalData,
        wagessumArray,
        staffsumArray,
        othersumArray,
        ['Wages', 'Staff', 'Others'],
        sendmail,
        compId,
        oneDayBeforedate,
        'PerDayCost',
        'xlsx',
        res
      );
    }

    if (sendmail == true) {
      return res.status(200).json({
        status: 200,
        message: 'Mail sent successfully.',
      });
    }

    return;
  } catch (error) {
    next(error);
  }
};

exports.totalpunchInCount = async (req, res, next) => {
  try {
    const { date } = req.body;

    const todayDate = new Date().toISOString().split('T')[0];
    const attendanceDate = date || todayDate;

    const count = await attendanceTransaction.count({
      distinct: true,
      col: 'userMasterID',
      where: {
        AttendanceDate: attendanceDate,
      },
    });

    return res.status(200).json({
      status: 200,
      data: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.totalpunchIn = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, date, Export } = req.body;
    const todayDate = date || new Date().toISOString().split('T')[0];

    const whereCondition = { AttendanceDate: todayDate };

    const condition = {
      status: 1,
    };
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('companyName')), {
          [Sequelize.Op.like]: `%${searchQuery.toLowerCase()}%`,
        }),
      ];
    }
    const paginationQuery =
      !Export && page && limit ? { offset: (page - 1) * limit, limit } : {};

    const attendanceCounts = await attendanceTransaction.findAll({
      attributes: [
        [
          Sequelize.fn('COUNT', Sequelize.col('AttendanceTransID')),
          'punchInCount',
        ],
        [Sequelize.col('userMaster.companyMaster.companyName'), 'companyName'],
        [
          Sequelize.col('userMaster.companyMaster.companyMasterID'),
          'companyMasterID',
        ],
      ],
      where: whereCondition,
      include: [
        {
          model: userMaster,
          attributes: [],
          include: [
            {
              model: companyMaster,
              attributes: [],
            },
          ],
        },
      ],
      group: [
        'userMaster.companyMaster.companyName',
        'userMaster.companyMaster.companyMasterID',
      ],
      raw: true,
    });

    const { rows: companyData, count } = await companyMaster.findAndCountAll({
      ...paginationQuery,
      where: condition,
      attributes: ['companyName', 'companyMasterID'],
      order: [['companyName', 'ASC']],
    });

    const result = companyData.map((company) => {
      const match = attendanceCounts.find(
        (att) => att.companyMasterID === company.companyMasterID
      );
      return {
        companyName: company.companyName,
        punchInCount: match ? +match.punchInCount : 0,
      };
    });

    // const { rows: result, count } = await companyMaster.findAndCountAll({
    //   ...paginationQuery,
    //   where: condition,
    //   attributes: [
    //     'companyName',
    //     'companyMasterID',
    //     [
    //       Sequelize.fn(
    //         'COUNT',
    //         Sequelize.col('userMaster.attendanceTransaction.AttendanceTransID')
    //       ),
    //       'punchInCount',
    //     ],
    //   ],
    //   include: [
    //     {
    //       model: userMaster,
    //       attributes: [],
    //       include: [
    //         {
    //           model: attendanceTransaction,
    //           attributes: [],
    //           where: whereCondition,
    //           required: false, // Left join to include companies without attendance records
    //         },
    //       ],
    //     },
    //   ],
    //   group: ['companyMaster.companyName', 'companyMaster.companyMasterID'],
    //   order: [['companyName', 'ASC']],
    //   raw: true,
    // });

    if (Export) {
      await generateExcel(result, 'PunchIn', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: result,
      totalCount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.attendancestatus_V2 = async (req, res, next) => {
  try {
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    let attendancetransaction = await AttendanceLogs.findOne({
      where: {
        userMasterID: req.body.userMasterID,
        AttendanceTransID: {
          [Sequelize.Op.notIn]: [0, 1, 3, 4],
        },
      },
      include: [
        {
          model: attendanceTransaction,
          attributes: ['AttendanceDate', 'ShiftIntime', 'userMasterID'],
          include: [
            {
              model: UserMaster,
              attributes: ['userMasterID'],
              include: [
                {
                  required: false,
                  separate: true,
                  model: EmployeeAttendancePolicy,
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
                  attributes: ['attendancePolicyID'],
                  include: [
                    {
                      model: AttendancePolicy,
                      as: 'attendancePolicy',
                      attributes: [
                        'missPunchMinutes',
                        'singleMultiplePunchInPunchOut',
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      attributes: ['logDateTime', 'direction', 'address', 'AttendanceTransID'],
      order: [['logDateTime', 'DESC']],
    });

    let In_Data = null;
    if (attendancetransaction && attendancetransaction.direction == 'out') {
      In_Data = await AttendanceLogs.findOne({
        where: {
          userMasterID: req.body.userMasterID,
          AttendanceTransID: {
            [Sequelize.Op.notIn]: [0, 1, 3, 4],
          },
          direction: 'in',
        },
        attributes: ['logDateTime', 'direction', 'address'],
        order: [['logDateTime', 'DESC']],
      });
    }

    const logData = {};
    if (attendancetransaction)
      (logData.logDateTime = attendancetransaction.logDateTime),
        (logData.direction = attendancetransaction.direction),
        (logData.address = attendancetransaction.address);

    let continuePunchIN = false;

    const get_one_data =
      attendancetransaction &&
      attendancetransaction.attendanceTransaction &&
      attendancetransaction.attendanceTransaction.userMaster &&
      attendancetransaction.attendanceTransaction.userMaster
        .employeeAttendancePolicies &&
      attendancetransaction.attendanceTransaction.userMaster
        .employeeAttendancePolicies.length > 0
        ? attendancetransaction.attendanceTransaction.userMaster
            .employeeAttendancePolicies[0].attendancePolicy
        : null;

    if (get_one_data && get_one_data.missPunchMinutes) {
      const attendanceData = attendancetransaction.attendanceTransaction;
      if (attendancetransaction && attendancetransaction.direction == 'in') {
        const time_Difference = await calculateDateTimeDifference(
          new Date(
            `${attendanceData.AttendanceDate} ${attendanceData.ShiftIntime}`
          ),
          new Date()
        );

        let timeDiff = Number(get_one_data.missPunchMinutes);

        if (time_Difference > timeDiff) {
          const dummyData = {
            logDateTime: null,
            direction: 'out',
            address: 'Missed Punch Out',
          };
          return res.json({
            status: 200,
            message: message.usermessage.attendancedata,
            data: {
              In_Data: logData,
              Out_Data: dummyData,
            },
            continuePunchIN: continuePunchIN,
          });
        }
      } else if (
        attendancetransaction &&
        attendancetransaction.direction == 'out'
      ) {
        const time_Difference = await calculateDateTimeDifference(
          new Date(
            `${attendanceData.AttendanceDate} ${attendanceData.ShiftIntime}`
          ),
          new Date()
        );

        let timeDiff = Number(get_one_data.missPunchMinutes);
        if (
          time_Difference < timeDiff &&
          get_one_data.singleMultiplePunchInPunchOut == 'Multiple'
        ) {
          continuePunchIN = true;
        }
      }
    } else if (get_one_data && !get_one_data.missPunchMinutes) {
      if (
        attendancetransaction &&
        attendancetransaction.direction == 'out' &&
        get_one_data.singleMultiplePunchInPunchOut == 'Multiple'
      ) {
        continuePunchIN = true;
      }
    } else {
      if (attendancetransaction && attendancetransaction.direction == 'out') {
        continuePunchIN = false;
      }
    }

    return res.json({
      status: 200,
      message: message.usermessage.attendancedata,
      data: {
        In_Data: In_Data
          ? In_Data
          : Object.keys(logData).length > 0
            ? logData
            : null,
        Out_Data: In_Data
          ? Object.keys(logData).length > 0
            ? logData
            : null
          : null,
      },
      continuePunchIN: continuePunchIN,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getUserLogDateWise = async (req, res, next) => {
  const { userMasterID, attendanceDate } = req.body;

  try {
    const getUserAttendance = await attendanceTransaction.findOne({
      where: {
        userMasterID,
        AttendanceDate: attendanceDate,
      },
      include: [
        {
          model: AttendanceLogs,
          attributes: ['attendanceLogID', 'logDateTime', 'direction'],
        },
      ],
      order: [[AttendanceLogs, 'logDateTime', 'ASC']],
    });

    return res.status(200).json({ status: 200, data: getUserAttendance });
  } catch (error) {
    next(error);
  }
};

exports.attendanceTimingReport = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      userMasterID,
      fromdate,
      todate,
      exportData,
      exportFileType,
      employeeType,
      page,
      limit,
    } = req.body;
    const paginationQuery =
      !exportData && page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      userMasterID: userMasterID,
      companyMasterId: companyMasterID,
    };

    const salaryPolicyList =
      'expat' === employeeType
        ? await SalaryPolicy.findAll({
            where: {
              salarycalculationBasedon: 'hourwise',
              monthlyFixhours: { [Sequelize.Op.ne]: null },
            },
            attributes: [
              'salaryPolicyID',
              'salaryPolicyName',
              'salarycalculationBasedon',
              'monthlyFixhours',
            ],
          })
        : null;

    const conditionalJoins = [
      {
        model: EmployeeJoiningDetails,
        attributes: ['employeeCode', 'employeeType', 'nationality'],
        required: true,
        where: {
          employeeType,
        },
      },
    ];
    if ('expat' === employeeType) {
      conditionalJoins.push({
        model: EmployeeSalaryPolicy,
        where: {
          status: 1,
          salaryPolicyID: salaryPolicyList.map((e) => e.salaryPolicyID),
          [Sequelize.Op.or]: [
            { startDate: { [Sequelize.Op.between]: [fromdate, todate] } },
            { endDate: { [Sequelize.Op.between]: [fromdate, todate] } },
            {
              startDate: { [Sequelize.Op.lte]: fromdate },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: todate } },
                { endDate: null },
              ],
            },
          ],
        },
        attributes: ['userMasterID', 'salaryPolicyID', 'startDate', 'endDate'],
      });
    }

    const [userAttendance, count, allShiftsList, allUserApprovedLeaves] =
      await Promise.all([
        /** Find users with attendence data */
        userMaster.findAll({
          ...paginationQuery,
          where: condition,
          attributes: ['displayName', 'userMasterID'],
          include: [
            ...conditionalJoins,
            {
              model: attendanceTransaction,
              required: false,
              where: {
                AttendanceDate: { [Sequelize.Op.between]: [fromdate, todate] },
              },
              attributes: [
                'AttendanceTransID',
                'Shifthrs',
                'InHrs',
                'OutHrs',
                'AttendanceDate',
                'roundOffMinutes',
                'withoutOtMinutes',
                'Shift',
              ],
              include: {
                model: overTimeCalculation,
                separate: true,
                attributes: ['UpdateOverTimeHourAndMin', 'OverTimeHourAndMin'],
                required: false,
              },
            },
            {
              model: EmployeeAttendancePolicy,
              separate: true,
              where: {
                status: 1,
                startDate: { [Sequelize.Op.lte]: new Date(fromdate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(fromdate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['attendancePolicyID'],
              include: [
                {
                  model: AttendancePolicy,
                  as: 'attendancePolicy',
                  attributes: ['considerWorkingHours'],
                },
              ],
            },
            {
              model: weekoffHolidayTran,
              required: false,
              attributes: ['date', 'tableName'],
              where: { date: { [Sequelize.Op.between]: [fromdate, todate] } },
            },
            {
              required: false,
              model: EmployeeShift,
              attributes: ['shiftID', 'shiftsID', 'startDate', 'endDate'],
              where: {
                status: 1,
                [Sequelize.Op.or]: [
                  {
                    startDate: {
                      [Sequelize.Op.between]: [fromdate, todate],
                    },
                  },
                  {
                    endDate: {
                      [Sequelize.Op.between]: [fromdate, todate],
                    },
                  },
                  {
                    [Sequelize.Op.and]: [
                      { startDate: { [Sequelize.Op.lte]: fromdate } },
                      {
                        [Sequelize.Op.or]: [
                          {
                            endDate: {
                              [Sequelize.Op.gte]: todate,
                            },
                          },
                          { endDate: { [Sequelize.Op.eq]: null } },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
            {
              required: false,
              model: ShiftRoster,
              attributes: ['shiftRosterDate', 'shiftID'],
              where: {
                status: 1,
                shiftRosterDate: {
                  [Sequelize.Op.between]: [fromdate, todate],
                },
              },
            },
          ],
        }),
        /** Find total counts */
        userMaster.count({
          where: condition,
          include: [...conditionalJoins],
        }),

        /** Find all shift */
        Shift.findAll({
          where: {
            companyMasterID: companyMasterID,
            status: 1,
          },
          attributes: ['shiftID'],
          include: [
            {
              model: ShiftTIme,
              attributes: [
                'day',
                'totalhours',
                'firsthalfendtime',
                'secondhalfstarttime',
                'totalhourshalfday',
              ],
            },
          ],
        }),

        /** Final All Approved leaves of user (Exclude L.W.P)*/
        UserLeaveTransaction.findAll({
          where: {
            status: 1,
            date: {
              [Sequelize.Op.between]: [fromdate, todate],
            },
          },
          order: [['date', 'DESC']],
          attributes: [
            'userLeaveTransactionID',
            'ReferenceID',
            'leaveAuthID',
            'LeaveTranId',
            'days',
            'date',
            'issandwichleave',
            'status',
          ],
          include: [
            {
              model: UserLeave,
              where: { userMasterID: userMasterID },
              attributes: ['userMasterID'],
            },
            {
              model: hrLeaveTypes,
              attributes: ['LeaveID'],
              where: {
                LeaveID: { [Sequelize.Op.ne]: 18 }, // exclude L.W.P
              },
            },
          ],
        }),
      ]);

    const attendanceData = [];

    for (const item of userAttendance) {
      const userLeaves = allUserApprovedLeaves.filter(
        (leave) => leave.userLeave.userMasterID == item.userMasterID
      );
      const tempData = {
        endPayDate: moment(todate, 'YYYY-MM-DD').format('DD-MM-YYYY'),
        employeeCode: item.employeeJoiningDetails?.[0]?.employeeCode || '',
        displayName: item.displayName,
        employeeType: item.employeeJoiningDetails?.[0]?.employeeType || '',
        workingHrs: 0,
        hrsClocked: 0,
        regHrsPayable: 0,
        ot1: 0,
        ot2: 0,
      };

      const salaryPolicyID = item.employeeSalaryPolicies?.[0]?.salaryPolicyID;

      if ('expat' === tempData.employeeType) {
        const salaryPolicy = salaryPolicyList.find(
          (e) => e.salaryPolicyID == salaryPolicyID
        );
        tempData.workingHrs = salaryPolicy?.monthlyFixhours || 0;
      } else {
        tempData.workingHrs = 88;
      }

      const holidayDates = item.weekoffHolidayTrans
        .filter((holiday) => holiday.tableName === 'holiday')
        .map((holiday) => holiday.date);
      const weekOffDates = item.weekoffHolidayTrans
        .filter((holiday) => holiday.tableName === 'weekoff')
        .map((holiday) => holiday.date);
      const attendanceDate = [];

      for (const attendance of item.attendanceTransactions) {
        attendanceDate.push(attendance.AttendanceDate);

        /** Find current date user's approved  leave */
        const currentDateUserLeaves = userLeaves.filter(
          (leave) => leave.date == attendance.AttendanceDate
        );

        let clockedHrs = +attendance.roundOffMinutes;
        let ot1Hrs = 0;
        let ot2Hrs = 0;
        let regHrs = 0;

        /** Calculate regular hour only if there is no weekoff */
        if (!weekOffDates.includes(attendance.AttendanceDate)) {
          let shiftBreakMin = 0;
          let shitFullDayMin = 0;
          let shitHalfDayMin = 0;
          let currentDateUserLevaveDay = 0;

          /** calculate total number of day's like half day or full day or user applied two leaves of half day for same day */
          if (currentDateUserLeaves.length) {
            currentDateUserLevaveDay = currentDateUserLeaves.reduce(
              (prev, curr) => prev + +curr.days,
              0
            );
          }

          /** Calculate brake hour based on shift first half end time and shift second half start time */
          const shitInfo = allShiftsList.find(
            (e) => e.shiftID == attendance.Shift
          );
          if (shitInfo) {
            const day = new Date(attendance.AttendanceDate).toLocaleString(
              'en-us',
              {
                weekday: 'long',
              }
            );
            const shiftTime = shitInfo.shiftTimes.find((e) => e.day == day);
            if (shiftTime) {
              if (shiftTime.firsthalfendtime && shiftTime.secondhalfstarttime) {
                const firstHalfEndTime = moment(
                  shiftTime.firsthalfendtime,
                  'h:mm A'
                );
                const secondHalfStartTime = moment(
                  shiftTime.secondhalfstarttime,
                  'h:mm A'
                );
                shiftBreakMin = secondHalfStartTime.diff(
                  firstHalfEndTime,
                  'minutes'
                );
              }
              shitFullDayMin = +shiftTime.totalhours * 60;
              shitHalfDayMin = +shiftTime.totalhourshalfday * 60;
            }
          }

          /** Calculate regular payable hours */
          if (clockedHrs >= shitFullDayMin + shiftBreakMin) {
            regHrs = shitFullDayMin;
          } else {
            if (clockedHrs >= shitHalfDayMin + shiftBreakMin) {
              if (currentDateUserLevaveDay == 0.5) {
                regHrs = shitHalfDayMin;
              } else if (currentDateUserLevaveDay == 1) {
                regHrs = 0;
              } else {
                regHrs = clockedHrs - shiftBreakMin;
              }
            } else {
              if (clockedHrs < shitHalfDayMin) {
                /**
                 * if user apply half day leave then consider half day
                 * if user apply full day leave then consider full day
                 * if user does not applied any leave then consider absent
                 */
                regHrs = 0;
              } else {
                if (currentDateUserLevaveDay == 1) {
                  regHrs = 0;
                } else {
                  regHrs = shitHalfDayMin;
                }
              }
            }
          }
        }

        if (weekOffDates.includes(attendance.AttendanceDate)) {
          if (
            attendance.OverTimeCalculations &&
            attendance.OverTimeCalculations.length
          )
            if (+attendance.OverTimeCalculations[0].UpdateOverTimeHourAndMin) {
              ot1Hrs =
                +attendance.OverTimeCalculations[0].UpdateOverTimeHourAndMin;
            }
        } else if (holidayDates.includes(attendance.AttendanceDate)) {
          const shiftMin = +attendance.Shifthrs * 60;
          ot2Hrs = clockedHrs;
          if (clockedHrs < shiftMin) {
            regHrs = shiftMin - clockedHrs;
          } else {
            regHrs = 0;
          }
        } else {
          if (
            attendance.OverTimeCalculations &&
            attendance.OverTimeCalculations.length
          )
            if (+attendance.OverTimeCalculations[0].UpdateOverTimeHourAndMin) {
              ot1Hrs =
                +attendance.OverTimeCalculations[0].UpdateOverTimeHourAndMin;
            }
        }
        if (currentDateUserLeaves.length) {
          regHrs += currentDateUserLeaves.reduce(
            (prev, curr) => prev + +attendance.Shifthrs * curr.days * 60,
            0
          );
        }
        tempData.hrsClocked += clockedHrs;
        tempData.regHrsPayable += regHrs;
        tempData.ot1 += ot1Hrs;
        tempData.ot2 += ot2Hrs;
      }

      /** Add hours of holiday according shit if used does not punch in on holiday */
      for (let holiday of holidayDates) {
        if (!attendanceDate.includes(holiday)) {
          /** Find roaster shift */
          const findDateWiseRoster =
            item.shiftRosters?.length > 0
              ? item.shiftRosters.find((e) => e.shiftRosterDate == holiday)
              : null;
          if (findDateWiseRoster) {
            const shiftInfo = allShiftsList.find(
              (e) => e.shiftID == findDateWiseRoster.shiftID
            );
            if (shiftInfo) {
              const day = new Date(holiday).toLocaleString('en-us', {
                weekday: 'long',
              });
              const shiftTime = shiftInfo.shiftTimes.find((e) => e.day == day);
              if (shiftTime?.totalhours) {
                tempData.regHrsPayable += +shiftTime?.totalhours * 60;
              }
            }
          } else {
            /** Find employee shift */
            const findDateWiseEmployeeShift = item.employeeShifts?.length
              ? item.employeeShifts.find(
                  (e) =>
                    e.startDate <= holiday &&
                    (e.endDate >= holiday || e.endDate == null)
                )
              : null;
            let employeeShiftIds = [];
            if (findDateWiseEmployeeShift) {
              if (findDateWiseEmployeeShift.shiftID) {
                employeeShiftIds = [findDateWiseEmployeeShift.shiftID];
              } else if (findDateWiseEmployeeShift.shiftsID.length) {
                employeeShiftIds = findDateWiseEmployeeShift.shiftsID;
              }
            }
            /** Employee shift can be multiple */
            if (employeeShiftIds.length) {
              const shiftTimeList = allShiftsList
                .filter((e) => employeeShiftIds.find((es) => es == e.shiftID))
                .map((e) => e.shiftTimes)
                .flat();
              if (shiftTimeList?.length) {
                const day = new Date(holiday).toLocaleString('en-us', {
                  weekday: 'long',
                });
                const dayWiseShiftTime = shiftTimeList
                  .filter((e) => e.day == day)
                  .sort((a, b) => +a.totalhours - b.totalhours);
                if (dayWiseShiftTime?.[0]?.totalhours) {
                  tempData.regHrsPayable +=
                    +dayWiseShiftTime?.[0]?.totalhours * 60;
                }
              }
            }
          }
        }
      }

      /** Add hours of leave according shift if user does not punch in on leave day */
      for (let leave of userLeaves) {
        const leaveDate = leave.date;
        if (!attendanceDate.includes(leaveDate)) {
          /** Find roaster shift */
          const findDateWiseRoster =
            item.shiftRosters?.length > 0
              ? item.shiftRosters.find((e) => e.shiftRosterDate == leaveDate)
              : null;
          if (findDateWiseRoster) {
            const shiftInfo = allShiftsList.find(
              (e) => e.shiftID == findDateWiseRoster.shiftID
            );
            if (shiftInfo) {
              const day = new Date(leaveDate).toLocaleString('en-us', {
                weekday: 'long',
              });
              const shiftTime = shiftInfo.shiftTimes.find((e) => e.day == day);
              if (shiftTime?.totalhours) {
                tempData.regHrsPayable +=
                  +shiftTime?.totalhours * leave.days * 60;
              }
            }
          } else {
            /** Find employee shift */
            const findDateWiseEmployeeShift = item.employeeShifts?.length
              ? item.employeeShifts.find(
                  (e) =>
                    e.startDate <= leaveDate &&
                    (e.endDate >= leaveDate || e.endDate == null)
                )
              : null;
            let employeeShiftIds = [];
            if (findDateWiseEmployeeShift) {
              if (findDateWiseEmployeeShift.shiftID) {
                employeeShiftIds = [findDateWiseEmployeeShift.shiftID];
              } else if (findDateWiseEmployeeShift.shiftsID.length) {
                employeeShiftIds = findDateWiseEmployeeShift.shiftsID;
              }
            }
            /** Employee shift can be multiple */
            if (employeeShiftIds.length) {
              const shiftTimeList = allShiftsList
                .filter((e) => employeeShiftIds.find((es) => es == e.shiftID))
                .map((e) => e.shiftTimes)
                .flat();
              if (shiftTimeList?.length) {
                const day = new Date(leaveDate).toLocaleString('en-us', {
                  weekday: 'long',
                });
                const dayWiseShiftTime = shiftTimeList
                  .filter((e) => e.day == day)
                  .sort((a, b) => +a.totalhours - b.totalhours);
                if (dayWiseShiftTime?.[0]?.totalhours) {
                  tempData.regHrsPayable +=
                    +dayWiseShiftTime[0].totalhours * leave.days * 60;
                }
              }
            }
          }
        }
      }

      tempData.hrsClocked = tempData.hrsClocked
        ? (+tempData.hrsClocked / 60).toFixed(2)
        : '00.00';
      tempData.regHrsPayable = tempData.regHrsPayable
        ? (+tempData.regHrsPayable / 60).toFixed(2)
        : '00.00';
      tempData.ot1 = tempData.ot1 ? (+tempData.ot1 / 60).toFixed(2) : '00.00';
      tempData.ot2 = tempData.ot2 ? (+tempData.ot2 / 60).toFixed(2) : '00.00';

      attendanceData.push(tempData);
    }

    if (exportData) {
      const exportList = [];
      for (let item of attendanceData) {
        exportList.push({
          'End Pay Date': item.endPayDate,
          'Employee Code': item.employeeCode,
          'Employee Name': item.displayName,
          'Employee Type': item.employeeType,
          'Working Hours (standard  Hours Should be)': item.workingHrs,
          'Hours Clocked': item.hrsClocked,
          'Reg Hours Payable': item.regHrsPayable,
          'Overtime1-hr (Normal Day and WeekOff)': item.ot1,
          'Overtime2 (Public Holiday)': item.ot2,
        });
      }
      return await generateExcel(
        exportList,
        'Attendance Timing',
        exportFileType || 'xlsx',
        res
      );
    }

    return res.status(200).json({
      status: 200,
      data: attendanceData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.attendanceByCompanyId = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      branchMasterID,
      designationID,
      departmentID,
      searchQuery,
      page,
      limit,
    } = req.body;
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const condition = {};
    const paginationQuery =
      page && limit ? { offset: (page - 1) * limit, limit: +limit } : {};

    let branchIds = branchMasterID ? [branchMasterID] : [];

    if (
      !branchMasterID &&
      req.userDetails &&
      req.userDetails.role &&
      req.userDetails.role.roleType == roleType.BRANCH_WISE
    ) {
      branchIds = req.userDetails.accessibleBranches;
    }

    condition.companyMasterId = companyMasterID;
    condition.status = 1;
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employeeJoiningDetails.employeeCode$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];
    }

    const { rows: getcompanyWiseUser, count } =
      await userMaster.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginationQuery,
        attributes: [
          'userMasterID',
          'displayName',
          'firstName',
          'middleName',
          'lastName',
          'photo',
          'companyMasterId',
        ],
        // ...accessibleUsers(userDetails, false, true),
        subQuery: false,
        include: [
          {
            required: true,
            separate: true,
            model: AttendanceLogs,
            where: {
              AttendanceTransID: {
                [Sequelize.Op.notIn]: [0, 1],
              },
            },
            order: [['logDateTime', 'DESC']],
            include: [
              {
                model: attendanceTransaction,
              },
            ],
          },
          {
            model: EmployeeJoiningDetails,
            where: {
              joiningDate: {
                [Sequelize.Op.lte]: currentDate,
              },

              [Sequelize.Op.or]: [
                { leavingDate: { [Sequelize.Op.eq]: null } },
                { leavingDate: { [Sequelize.Op.gte]: currentDate } },
                {
                  leavingDate: {
                    [Sequelize.Op.eq]: '',
                  },
                },
              ],
            },
            attributes: ['employeeCode', 'joiningDate', 'leavingDate'],
          },
          {
            model: EmployeeDesignation,
            where: {
              status: 1,
              ...(designationID && { designationID: designationID }),
              applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            required: designationID ? true : false,
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
              ...(departmentID && { departmentID: departmentID }),
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            required: departmentID ? true : false,
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
              ...(isArray(branchIds) &&
                branchIds.length && { branchID: branchIds }),
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            required: isArray(branchIds) && branchIds.length ? true : false,
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
            model: attendanceTransaction,
            where: {
              AttendanceDate: currentDate,
            },
            attributes: [
              'AttendanceTransID',
              'InDatetime',
              'OutDateTime',
              'AttendanceDate',
              'userMasterID',
              'Shifthrs',
              'ShiftIntime',
              'ShiftoutTime',
              'InHrs',
              'LateBy',
              'EarlyBy',
            ],
          },
          {
            separate: true,
            required: false,
            model: EmployeeAttendance,
            where: {
              status: 1,
              startDate: {
                [Sequelize.Op.lte]: new Date(currentDate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: {
                    [Sequelize.Op.gte]: new Date(currentDate),
                  },
                },
                {
                  endDate: { [Sequelize.Op.eq]: null },
                },
              ],
            },
            attributes: [
              'employeeAttendancePolicyID',
              'userMasterID',
              'attendancePolicyID',
              'startDate',
              'endDate',
            ],
            include: [
              {
                model: AttendancePolicy,
                as: 'attendancePolicy',
              },
            ],
          },
        ],
      });

    for (let user of getcompanyWiseUser) {
      const userMasterID = user.userMasterID;
      const attendancetransaction =
        user.attendancelogs &&
        user.attendancelogs.length > 0 &&
        user.attendancelogs[0].attendanceTransaction
          ? user.attendancelogs[0].attendanceTransaction
          : null;
      if (user.attendancelogs.length) {
        user.attendancelogs.length = 1;
      }
      const latest_attendanceLog =
        user.attendancelogs && user.attendancelogs.length > 0
          ? user.attendancelogs[0]
          : null;
      let continuePunchIN = false;

      const get_one_data =
        user.employeeAttendancePolicies &&
        user.employeeAttendancePolicies.length > 0
          ? user.employeeAttendancePolicies[0].attendancePolicy
            ? user.employeeAttendancePolicies[0].attendancePolicy
            : null
          : null;

      if (get_one_data && get_one_data.missPunchMinutes) {
        if (latest_attendanceLog && latest_attendanceLog.direction == 'in') {
          const time_Difference = await calculateDateTimeDifference(
            new Date(
              `${attendancetransaction.AttendanceDate} ${attendancetransaction.ShiftIntime}`
            ),
            new Date()
          );

          let timeDiff = Number(get_one_data.missPunchMinutes);

          if (time_Difference > timeDiff) {
            const dummyData = AttendanceLogs.build({
              attendanceLogID: null,
              userMasterID: attendancetransaction.userMasterID,
              logDateTime: null,
              direction: 'out',
              photo: null,
              attendnaceFrom: null,
              longitude: null,
              latitude: null,
              address: 'Missed Punch Out',
              AttendanceTransID: null,
              createBy: null,
              updateBy: null,
              createByIp: null,
              updateByIp: null,
              createdAt: null,
              updatedAt: null,
            });
            user.dataValues.attendancelogs = [dummyData];
            user.dataValues.continuePunchIN = continuePunchIN;
          }
        }
      }
    }

    return res.status(200).json({
      status: 200,
      data: getcompanyWiseUser,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

// Add manually LCEG Penalty
exports.addLCEGPenalty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      userMasterID,
      AttendanceDate,
      penaltyType,
      penaltyDeductionType,
      value,
    } = req.body;

    if (
      !userMasterID ||
      !AttendanceDate ||
      !penaltyType ||
      !penaltyDeductionType ||
      !value
    ) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }

    if (+value <= 0) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Enter a positive value!',
      });
    }

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    const [weekoffHoliday, attendance, verifiedAttendance] = await Promise.all([
      weekoffHolidayTran.findOne({
        where: {
          userMasterID,
          date: AttendanceDate,
          [Sequelize.Op.or]: [
            { optionalHoliday: false },
            { optionalHoliday: null },
          ],
        },
      }),

      attendanceTransaction.findOne({
        where: {
          userMasterID,
          AttendanceDate,
        },
      }),

      HrLeaveMonthlyTrans.findOne({
        where: {
          userMasterID,
          monthstartdate: {
            [Sequelize.Op.lte]: AttendanceDate,
          },
          monthenddate: {
            [Sequelize.Op.gte]: AttendanceDate,
          },
          verified: 1,
        },
      }),
    ]);

    if (verifiedAttendance) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Attendance already verified!',
      });
    }

    if (weekoffHoliday) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Weekoff on this date!',
      });
    }

    if (!attendance) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Attendance not found!',
      });
    }

    await AttendanceCorrection.create(
      {
        AttendanceTransID: attendance.AttendanceTransID,
        userMasterID: attendance.userMasterID,
        departmentID: attendance.departmentID,
        designationID: attendance.designationID,
        branchID: attendance.branchID,
        InDatetime: attendance.InDatetime,
        OutDateTime: attendance.OutDateTime,
        AttendanceDate: attendance.AttendanceDate,
        Shift: attendance.Shift,
        Shifthrs: attendance.Shifthrs,
        ShiftIntime: attendance.ShiftIntime,
        ShiftoutTime: attendance.ShiftoutTime,
        InHrs: Math.floor(attendance.InHrs),
        OutHrs: attendance.OutHrs,
        LateBy: attendance.LateBy,
        EarlyBy: attendance.EarlyBy,
        Panalty: attendance.Panalty,
        PanaltyDeduction: attendance.PanaltyDeduction,
        Othrs: attendance.Othrs,
        fulldayhalfday: attendance.fulldayhalfday,
        punchINbranch: attendance.punchINbranch,
        punchOUTbranch: attendance.punchOUTbranch,
        goEarlyUsed: attendance.goEarlyUsed,
        createBy: createBy,
        createByIp: createByIp,
        Status: attendance.Status,
        updateBy: createBy,
        updateByIp: createByIp,
        ChangeBy: 'mannual',
        roundOffMinutes: attendance.roundOffMinutes,
        remarks: attendance.remarks,
        withoutOtMinutes: attendance.withoutOtMinutes,
        LCPenaltyFrom: attendance.LCPenaltyFrom,
        EGPenaltyFrom: attendance.EGPenaltyFrom,
      },
      { transaction }
    );

    const updateData = {
      updateBy: createBy,
      updateByIp: createByIp,
    };

    if (penaltyType == 'LC') {
      updateData.PanaltyDeduction = penaltyDeductionType;
      updateData.Panalty = value;
      updateData.LCPenaltyFrom = 'M';
    }

    if (penaltyType == 'EG') {
      updateData.goEarlyPanaltyDeduction = penaltyDeductionType;
      updateData.goEarlyPanalty = value;
      updateData.EGPenaltyFrom = 'M';
    }

    await attendanceTransaction.update(updateData, {
      where: {
        AttendanceTransID: attendance.AttendanceTransID,
      },
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Attendance Penalty'),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Remove Manually LCEG Penalty
exports.deleteLCEGPenalty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userMasterID, AttendanceDate, penaltyType } = req.body;

    if (!userMasterID || !AttendanceDate || !penaltyType) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    const [attendance, verifiedAttendance] = await Promise.all([
      attendanceTransaction.findOne({
        where: {
          userMasterID,
          AttendanceDate,
        },
      }),
      HrLeaveMonthlyTrans.findOne({
        where: {
          userMasterID,
          monthstartdate: {
            [Sequelize.Op.lte]: AttendanceDate,
          },
          monthenddate: {
            [Sequelize.Op.gte]: AttendanceDate,
          },
          verified: 1,
        },
      }),
    ]);

    if (verifiedAttendance) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Attendance already verified!',
      });
    }

    if (!attendance) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Attendance not found!',
      });
    }

    await AttendanceCorrection.create(
      {
        AttendanceTransID: attendance.AttendanceTransID,
        userMasterID: attendance.userMasterID,
        departmentID: attendance.departmentID,
        designationID: attendance.designationID,
        branchID: attendance.branchID,
        InDatetime: attendance.InDatetime,
        OutDateTime: attendance.OutDateTime,
        AttendanceDate: attendance.AttendanceDate,
        Shift: attendance.Shift,
        Shifthrs: attendance.Shifthrs,
        ShiftIntime: attendance.ShiftIntime,
        ShiftoutTime: attendance.ShiftoutTime,
        InHrs: Math.floor(attendance.InHrs),
        OutHrs: attendance.OutHrs,
        LateBy: attendance.LateBy,
        EarlyBy: attendance.EarlyBy,
        Panalty: attendance.Panalty,
        PanaltyDeduction: attendance.PanaltyDeduction,
        Othrs: attendance.Othrs,
        fulldayhalfday: attendance.fulldayhalfday,
        punchINbranch: attendance.punchINbranch,
        punchOUTbranch: attendance.punchOUTbranch,
        goEarlyUsed: attendance.goEarlyUsed,
        createBy: createBy,
        createByIp: createByIp,
        Status: attendance.Status,
        updateBy: createBy,
        updateByIp: createByIp,
        ChangeBy: 'mannual',
        roundOffMinutes: attendance.roundOffMinutes,
        remarks: attendance.remarks,
        withoutOtMinutes: attendance.withoutOtMinutes,
        LCPenaltyFrom: attendance.LCPenaltyFrom,
        EGPenaltyFrom: attendance.EGPenaltyFrom,
      },
      { transaction }
    );

    const updateData = {
      updateBy: createBy,
      updateByIp: createByIp,
    };

    if (penaltyType == 'LC') {
      updateData.PanaltyDeduction = null;
      updateData.Panalty = null;
      updateData.LCPenaltyFrom = 'RM';
    }

    if (penaltyType == 'EG') {
      updateData.goEarlyPanaltyDeduction = null;
      updateData.goEarlyPanalty = null;
      updateData.EGPenaltyFrom = 'RM';
    }

    await attendanceTransaction.update(updateData, {
      where: {
        AttendanceTransID: attendance.AttendanceTransID,
      },
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Attendance Penalty'),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
