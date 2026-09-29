const companyProgress = require('../models/companyProgress');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const WeekOffShuffle = require('../models/weekOffShuffle');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const { generateExcel } = require('../utils/exportData');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const attendanceTransaction = require('../models/attendanceTransaction');
const {
  asiaKolkataDateTime,
  addFoodAllowanceInAttendance_Manual,
  lateEarlyPenalty_Manual,
  normal_overtime_Manual,
  deleteOvertimeCoff,
  addCoff_Manual,
  coff_Overtime_Manual,
  getIncludeModels,
  roundToNearestHour,
  coff_addLeave_Manual,
  coff_addExtraDays_Manual,
  normal_addLeave_Manual,
  normal_addExtraDays_Manual,
} = require('../utils/commonUtilFunctions');
const { executeQuery } = require('./common.controller');
const EmployeeShortLeavePolicy = require('../models/employeeShortLeavePolicy');
const ShortLeavePolicy = require('../models/shortLeave');
const UserShortLeave = require('../models/userShortLeave');
const Shift = require('../models/shift');

exports.postadd = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { userMasterID, weekoffShuffled, shuffled, remarks } = req.body;

    //Inclued Model to Get Data (weekoffShuffled)
    const weekoffShuffledincludedModels =
      await getIncludeModels(weekoffShuffled);
    weekoffShuffledincludedModels.push(
      // Employee Attendance Transaction
      {
        model: attendanceTransaction,
        required: false,
        where: {
          Status: 1,
          AttendanceDate: weekoffShuffled,
        },
        include: [
          {
            separate: true,
            required: false,
            model: UserShortLeave,
            where: {
              date: weekoffShuffled,
              authorizationStatus: 3,
            },
          },
        ],
      },
      //Hr Leave Monthly Transaction
      {
        separate: true,
        required: false,
        model: HrLeaveMonthlyTrans,
        where: {
          monthstartdate: { [Sequelize.Op.lte]: weekoffShuffled },
          monthenddate: { [Sequelize.Op.gte]: weekoffShuffled },
          verified: 1,
        },
      },
      //Week OFF Holiday Transaction
      {
        separate: true,
        required: false,
        model: weekoffHolidayTran,
        where: {
          date: weekoffShuffled,
          tableName: 'weekoff',
        },
      },
      //Week OFF Shuffled
      {
        separate: true,
        required: false,
        model: WeekOffShuffle,
        where: {
          weekoffShuffled,
          userMasterID: userMasterID,
        },
      }
    );
    //Find User Data(weekoffShuffled)  11
    const weekoffShuffleduserData = await UserMaster.findAll({
      where: {
        userMasterID,
        status: 1,
      },
      include: weekoffShuffledincludedModels,
      transaction,
    });

    //Inclued Model to Get Data (Shuffle)
    const shuffledincludedModels = await getIncludeModels(shuffled);
    shuffledincludedModels.push(
      // Employee Attendance Transaction
      {
        model: attendanceTransaction,
        required: false,
        where: {
          Status: 1,
          AttendanceDate: shuffled,
        },
        include: [
          {
            separate: true,
            required: false,
            model: UserShortLeave,
            where: {
              date: shuffled,
              authorizationStatus: 3,
            },
          },
        ],
      },
      //Hr Leave Monthly Transaction
      {
        separate: true,
        required: false,
        model: HrLeaveMonthlyTrans,
        where: {
          // AttnYearMon: { [Sequelize.Op.eq]: shuffled_YYYYMM },
          monthstartdate: { [Sequelize.Op.lte]: shuffled },
          monthenddate: { [Sequelize.Op.gte]: shuffled },
          verified: 1,
        },
      },
      //Week OFF Holiday Transaction
      {
        separate: true,
        required: false,
        model: weekoffHolidayTran,
        where: {
          date: shuffled,
          tableName: 'weekoff',
        },
      },
      //Week OFF Shuffled
      {
        separate: true,
        required: false,
        model: WeekOffShuffle,
        where: {
          shuffled,
          userMasterID,
        },
      }
    );

    //Find User Data(Shuffle)  10
    const ShuffleduserData = await UserMaster.findAll({
      where: {
        userMasterID,
        status: 1,
      },
      include: shuffledincludedModels,
      transaction,
    });

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    //Initialize
    const dataToInsert = [];
    const notAddedUsers = [];
    const existingUserNames = [];
    const alreadyExistsUsers = [];
    const attendanceVerifedUsers = [];

    for (let user of userMasterID) {
      // Find weekoff Shuffled User
      const getweekoffShuffleduserData = weekoffShuffleduserData
        ? weekoffShuffleduserData.find((e) => e.userMasterID == user)
        : null;

      // Find Shuffled User
      const getShuffleduserData = ShuffleduserData
        ? ShuffleduserData.find((e) => e.userMasterID == user)
        : null;

      // Find Attendace Verification (weekoffShuffled)
      const findweekoffShuffledAttendaceVerification =
        getweekoffShuffleduserData &&
        getweekoffShuffleduserData.hrLeaveMonthlyTrans &&
        getweekoffShuffleduserData.hrLeaveMonthlyTrans.length > 0
          ? getweekoffShuffleduserData.hrLeaveMonthlyTrans[0]
          : null;

      // Find Attendace Verification (Shuffle)
      const findShuffleAttendaceVerification =
        getShuffleduserData &&
        getShuffleduserData.hrLeaveMonthlyTrans &&
        getShuffleduserData.hrLeaveMonthlyTrans.length > 0
          ? getShuffleduserData.hrLeaveMonthlyTrans[0]
          : null;

      // Check for Attendance Verification
      if (
        findweekoffShuffledAttendaceVerification ||
        findShuffleAttendaceVerification
      ) {
        attendanceVerifedUsers.push(getweekoffShuffleduserData.displayName);
        continue;
      }

      // Find Weekoff Trans  (weekoffShuffled)
      const weekoffShuffledtranscation =
        getweekoffShuffleduserData &&
        getweekoffShuffleduserData.weekoffHolidayTrans &&
        getweekoffShuffleduserData.weekoffHolidayTrans.length > 0
          ? getweekoffShuffleduserData.weekoffHolidayTrans[0]
          : null;

      if (!weekoffShuffledtranscation) {
        notAddedUsers.push(getweekoffShuffleduserData.displayName);
        continue;
      }

      // Find Weekoff Trans (Shuffle)
      const Shuffledtranscation =
        getShuffleduserData &&
        getShuffleduserData.weekoffHolidayTrans &&
        getShuffleduserData.weekoffHolidayTrans.length > 0
          ? getShuffleduserData.weekoffHolidayTrans[0]
          : null;

      if (Shuffledtranscation) {
        alreadyExistsUsers.push(getweekoffShuffleduserData.displayName);
        continue;
      }

      // Already Shuffle Dates
      const findWeekoffShuffledDatesData =
        getweekoffShuffleduserData &&
        getweekoffShuffleduserData.weekOffShuffles &&
        getweekoffShuffleduserData.weekOffShuffles.length > 0
          ? getweekoffShuffleduserData.weekOffShuffles[0]
          : null;

      // Already Shuffle Dates
      const findShuffledDatesData =
        getShuffleduserData &&
        getShuffleduserData.weekOffShuffles &&
        getShuffleduserData.weekOffShuffles.length > 0
          ? getShuffleduserData.weekOffShuffles[0]
          : null;

      if (findWeekoffShuffledDatesData || findShuffledDatesData) {
        existingUserNames.push(getweekoffShuffleduserData.displayName);
        continue;
      }

      const day = new Date(shuffled).toLocaleString('en-us', {
        weekday: 'long',
      });
      //Update Week Off Holiday Trans
      await weekoffHolidayTran.update(
        { date: shuffled, tableName: 'weekoff', dayName: day.toLowerCase() },
        {
          where: {
            userMasterID: user,
            date: weekoffShuffled,
            tableName: 'weekoff',
          },
          transaction,
        }
      );

      // Find Attendace Transaction (weekoffShuffled)
      const weekoffShuffledattendance =
        getweekoffShuffleduserData &&
        getweekoffShuffleduserData.attendanceTransactions &&
        getweekoffShuffleduserData.attendanceTransactions.length > 0
          ? getweekoffShuffleduserData.attendanceTransactions[0]
          : null;

      if (weekoffShuffledattendance && weekoffShuffledattendance.OutDateTime) {
        await oldWeekOffDay(
          getweekoffShuffleduserData,
          weekoffShuffledattendance,
          weekoffShuffled,
          transaction,
          createBy,
          createByIp
        );
      }

      // Find Attendace Transaction (Shuffle)
      const shuffledattendance =
        getShuffleduserData &&
        getShuffleduserData.attendanceTransactions &&
        getShuffleduserData.attendanceTransactions.length > 0
          ? getShuffleduserData.attendanceTransactions[0]
          : null;

      if (shuffledattendance && shuffledattendance.OutDateTime) {
        await newWeekOffDay(
          getShuffleduserData,
          shuffledattendance,
          shuffled,
          transaction,
          createBy,
          createByIp
        );
      }

      dataToInsert.push({
        weekoffShuffled,
        shuffled,
        userMasterID: user,
        remarks,
        createBy,
        createByIp,
      });
    }

    // Proceed with the bulk insert if no existing users
    const insertedRecords = await WeekOffShuffle.bulkCreate(dataToInsert, {
      transaction,
    });
    const addedCount = insertedRecords.length;

    let finalMessage = `Total records added successfully: ${addedCount}.`;

    if (notAddedUsers.length > 0) {
      finalMessage += ` (No weekoff found for: ${notAddedUsers.join(', ')})`;
    }

    if (alreadyExistsUsers.length > 0) {
      finalMessage += ` (Weekoff already exists for: ${alreadyExistsUsers.join(
        ', '
      )})`;
    }

    if (existingUserNames.length > 0) {
      finalMessage += ` (Shuffled date already exists for: ${existingUserNames.join(
        ', '
      )})`;
    }

    if (attendanceVerifedUsers.length > 0) {
      finalMessage += ` (Attendance already verified for: ${attendanceVerifedUsers.join(
        ', '
      )})`;
    }

    await transaction.commit(); // Commit the transaction
    return res.status(200).json({
      status: 200,
      message: finalMessage,
      addedCount: addedCount,
    });
  } catch (err) {
    await transaction.rollback(); // Rollback the transaction in case of an error
    next(err);
  }
};

exports.getdata = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      searchQuery,
      userMasterID,
      exportData,
      companyMasterID,
      startdate,
      enddate,
    } = await req.body;

    const condition = {};

    const condition1 = {};

    const condition2 = {};

    if (userMasterID) condition.userMasterID = userMasterID;

    if (companyMasterID) condition2.companyMasterID = companyMasterID;

    if (searchQuery)
      condition1.displayName = { [Sequelize.Op.iLike]: `%${searchQuery}%` };

    if (startdate && enddate)
      condition.weekoffShuffled = {
        [Sequelize.Op.between]: [startdate, enddate],
      };

    const paginationQuery = !exportData
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const { rows, count } = await WeekOffShuffle.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: UserMaster,
          where: condition1,
          required: true,
          attributes: [
            'userNumber',
            'displayName',
            'userMasterID',
            'companyMasterId',
          ],
          include: [
            {
              model: companyMaster,
              where: condition2,
            },
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
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
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
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
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
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
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              required: false,
              model: EmployeeWorkingArea,
              where: {
                status: 1,
                startDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              attributes: ['id'],
              include: [
                {
                  model: WorkingArea,
                  attributes: ['workingAreaName'],
                },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    if (exportData) {
      const finaldata = rows.map((e) => {
        return {
          'Employee Code':
            e['userMaster.employeeJoiningDetails.employeeCode'] || '',
          'Employee Name': e['userMaster.displayName'],
          'Employee Number': e['userMaster.userNumber'],
          // 'Company Name': e['userMaster.companyMaster.companyName'],
          Branch:
            e['userMaster.employeeBranches.branchMaster.branchName'] || '',
          Department:
            e['userMaster.employeeDepartments.department.departmentName'] || '',
          Designation:
            e['userMaster.employeeDesignations.designation.designationName'] ||
            '',
          WorkingArea:
            e['userMaster.employeeWorkingAreas.workingArea.workingAreaName'] ||
            '',
          'WeekOff Shuffle': e.weekoffShuffled
            ? new Date(e.weekoffShuffled).toLocaleDateString('en-GB')
            : 'DD-MM-YYYY',
          Shuffle: e.shuffled
            ? new Date(e.weekoffShuffled).toLocaleDateString('en-GB')
            : 'DD-MM-YYYY',
          Remarks: e.remarks,
        };
      });

      await generateExcel(finaldata, 'WeekOff Shuffle', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.deletedatabyId = async (req, res, next) => {
  const transaction = await sequelize.transaction(); // Start a transaction

  try {
    const { id } = req.params;

    const findData = await WeekOffShuffle.findByPk(id, { transaction });

    const { weekoffShuffled, userMasterID, shuffled } = findData;

    let weekoffShuffled_YYYYMM =
      String(weekoffShuffled).slice(0, 4) + String(weekoffShuffled).slice(5, 7);

    const shuffled_YYYYMM =
      String(shuffled).slice(0, 4) + String(shuffled).slice(5, 7);

    const checkAttendanceVerification = await HrLeaveMonthlyTrans.findOne({
      where: {
        userMasterID: userMasterID,
        [Sequelize.Op.or]: [
          {
            AttnYearMon: { [Sequelize.Op.eq]: shuffled_YYYYMM },
            AttnYearMon: { [Sequelize.Op.eq]: weekoffShuffled_YYYYMM },
          },
        ],
        verified: 1,
      },
    });

    if (checkAttendanceVerification) {
      await transaction.rollback();

      return res.status(200).json({
        status: 401,
        message:
          'You can not delete weekoff shuffle entery. Attendance already verified.',
      });
    }
    //Inclued Model to Get Data (weekoffShuffled)
    const weekoffShuffledincludedModels =
      await getIncludeModels(weekoffShuffled);
    weekoffShuffledincludedModels.push(
      // Employee Attendance Transaction
      {
        model: attendanceTransaction,
        required: false,
        where: {
          Status: 1,
          AttendanceDate: weekoffShuffled,
        },
        include: [
          {
            separate: true,
            required: false,
            model: UserShortLeave,
            where: {
              date: weekoffShuffled,
              authorizationStatus: 3,
            },
          },
        ],
      },
      //Hr Leave Monthly Transaction
      {
        separate: true,
        required: false,
        model: HrLeaveMonthlyTrans,
        where: {
          AttnYearMon: { [Sequelize.Op.eq]: weekoffShuffled_YYYYMM },
          verified: 1,
        },
      },
      //Week OFF Holiday Transaction
      {
        separate: true,
        required: false,
        model: weekoffHolidayTran,
        where: {
          date: weekoffShuffled,
          tableName: 'weekoff',
        },
      },
      //Week OFF Shuffled
      {
        separate: true,
        required: false,
        model: WeekOffShuffle,
        where: {
          weekoffShuffled,
          userMasterID: userMasterID,
        },
      }
    );
    //Find User Data(weekoffShuffled)  11
    const weekoffShuffleduserData = await UserMaster.findOne({
      where: {
        userMasterID,
        status: 1,
      },
      include: weekoffShuffledincludedModels,
    });

    //Inclued Model to Get Data (Shuffle)
    const shuffledincludedModels = await getIncludeModels(shuffled);
    shuffledincludedModels.push(
      // Employee Attendance Transaction
      {
        model: attendanceTransaction,
        required: false,
        where: {
          Status: 1,
          AttendanceDate: shuffled,
        },
        include: [
          {
            separate: true,
            required: false,
            model: UserShortLeave,
            where: {
              date: shuffled,
              authorizationStatus: 3,
            },
          },
        ],
      },
      //Hr Leave Monthly Transaction
      {
        separate: true,
        required: false,
        model: HrLeaveMonthlyTrans,
        where: {
          AttnYearMon: { [Sequelize.Op.eq]: shuffled_YYYYMM },
          verified: 1,
        },
      },
      //Week OFF Holiday Transaction
      {
        separate: true,
        required: false,
        model: weekoffHolidayTran,
        where: {
          date: shuffled,
          tableName: 'weekoff',
        },
      },
      //Week OFF Shuffled
      {
        separate: true,
        required: false,
        model: WeekOffShuffle,
        where: {
          shuffled,
          userMasterID,
        },
      }
    );

    //Find User Data(Shuffle)  10
    const ShuffleduserData = await UserMaster.findOne({
      where: {
        userMasterID,
        status: 1,
      },
      include: shuffledincludedModels,
    });
    const day = new Date(weekoffShuffled).toLocaleString('en-us', {
      weekday: 'long',
    });
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    await weekoffHolidayTran.update(
      { date: weekoffShuffled, dayName: day },
      {
        where: {
          userMasterID: userMasterID,
          date: shuffled,
        },
        transaction,
      }
    );
    // Find Attendace Transaction (weekoffShuffled)
    const weekoffShuffledattendance =
      weekoffShuffleduserData &&
      weekoffShuffleduserData.attendanceTransactions &&
      weekoffShuffleduserData.attendanceTransactions.length > 0
        ? weekoffShuffleduserData.attendanceTransactions[0]
        : null;

    if (weekoffShuffledattendance && weekoffShuffledattendance.OutDateTime) {
      await oldWeekOffDay(
        weekoffShuffleduserData,
        weekoffShuffledattendance,
        weekoffShuffled,
        transaction,
        createBy,
        createByIp
      );
    }

    // Find Attendace Transaction (Shuffle)
    const shuffledattendance =
      ShuffleduserData &&
      ShuffleduserData.attendanceTransactions &&
      ShuffleduserData.attendanceTransactions.length > 0
        ? ShuffleduserData.attendanceTransactions[0]
        : null;

    if (shuffledattendance && shuffledattendance.OutDateTime) {
      await newWeekOffDay(
        ShuffleduserData,
        shuffledattendance,
        shuffled,
        transaction,
        createBy,
        createByIp
      );
    }

    await findData.destroy({
      transaction,
      user: req.userDetails,
    });

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Week Off Shuffle'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

async function oldWeekOffDay(
  userData,
  weekoffShuffledattendance,
  weekoffShuffled,
  transaction,
  createBy,
  createByIp
) {
  if (!weekoffShuffledattendance || !weekoffShuffledattendance.OutDateTime) {
    return;
  }

  const get_one_data = weekoffShuffledattendance;
  const usershortleave = get_one_data?.userShortLeaves?.[0] || null;

  const attendance =
    userData.employeeAttendancePolicies &&
    userData.employeeAttendancePolicies.length > 0
      ? userData.employeeAttendancePolicies[0].attendancePolicy
        ? userData.employeeAttendancePolicies[0].attendancePolicy
        : null
      : null;

  const empJoing =
    userData.employeeJoiningDetails &&
    userData.employeeJoiningDetails.length > 0
      ? userData.employeeJoiningDetails[0]
      : null;

  const salaryPolicy =
    userData.employeeSalaryPolicies &&
    userData.employeeSalaryPolicies.length > 0
      ? userData.employeeSalaryPolicies[0]
      : null;

  const LC_EG_Policy =
    userData.employeeLateEarlyPolicies &&
    userData.employeeLateEarlyPolicies.length > 0
      ? userData.employeeLateEarlyPolicies[0]
      : null;

  await attendanceTransaction.update(
    {
      Panalty: null,
      PanaltyDeduction: null,
      goEarlyUsed: 0,
      goEarlyPanalty: null,
      goEarlyPanaltyDeduction: null,
      earlyPenaltyMinutes: null,
      latePenaltyMinutes: null,
      updateBy: createBy,
    },
    {
      where: {
        AttendanceTransID: get_one_data.AttendanceTransID,
      },
      transaction,
    }
  );
  const attendanceData = await attendanceTransaction.findOne({
    where: {
      AttendanceTransID: get_one_data.AttendanceTransID,
    },
    include: [{ model: Shift }],
    transaction,
  });
  let totaltime = Math.abs(
    (new Date(attendanceData.OutDateTime) -
      new Date(attendanceData.InDatetime)) /
      (1000 * 60)
  );
  totaltime = Math.round(totaltime - +attendanceData.OutHrs);
  // totaltime = Number(get_one_data.InHrs) + Number(minutes);
  if (
    +userData.companyMasterId == 168 &&
    new Date(attendanceData.InDatetime) <
      new Date(attendanceData.AttendanceDate + ' ' + attendanceData.ShiftIntime)
  ) {
    const difference = Math.abs(
      (new Date(
        attendanceData.AttendanceDate + ' ' + attendanceData.ShiftIntime
      ) -
        new Date(attendanceData.InDatetime)) /
        (1000 * 60)
    );
    totaltime = Math.round(totaltime - +difference);
  }
  let skipMinutes = 0;
  let fulldayHalfdayMinutes = 0;

  if (
    attendance &&
    attendance.considerOvertimeAfter == 'totalworkinghours' &&
    attendance.preShiftHrsConsideration == 0
  ) {
    if (
      new Date(get_one_data.InDatetime) <
      new Date(get_one_data.AttendanceDate + ' ' + get_one_data.ShiftIntime)
    ) {
      const diffMilliseconds =
        new Date(get_one_data.AttendanceDate + ' ' + get_one_data.ShiftIntime) -
        new Date(get_one_data.InDatetime);

      skipMinutes = Math.floor(diffMilliseconds / (1000 * 60));
      // skip minutes from fulldayhalfday minutes

      fulldayHalfdayMinutes -= +skipMinutes;
    }
  }

  let final_Minutes = Math.round(+totaltime);

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

  // if user short leave

  if (usershortleave && attendanceData) {
    await UserShortLeave.update(
      {
        authorizationStatus: 5,
        cancelRemarks: 'cancelled by weekoff shuffle',
      },
      {
        where: {
          date: attendanceData.AttendanceDate,
          userMasterID: attendanceData.userMasterID,
        },
        transaction,
      }
    );
  }

  // delete coff and overtime
  await deleteOvertimeCoff(
    get_one_data.userMasterID,
    get_one_data.AttendanceDate,
    transaction
  );

  await lateEarlyPenalty_Manual(
    LC_EG_Policy,
    salaryPolicy,
    attendanceData,
    transaction,
    attendance
  );
  if (attendance?.giveOTAs) {
    //If Overtime
    if (attendance.giveOTAs == 'Overtime') {
      await normal_overtime_Manual(
        empJoing,
        attendance,
        userData.userMasterID,
        get_one_data.AttendanceTransID,
        userData.companyMasterId,
        skipMinutes,
        transaction,
        extraMinutes,
        0
      );
    } else if (attendance.giveOTAs == 'AddLeave') {
      await normal_addLeave_Manual(
        attendance,
        attendanceData,
        createBy,
        createByIp,
        userData.companyMasterId,
        +totaltime,
        transaction
      );
    } else if (attendance.giveOTAs == 'AddExtraDays') {
      await normal_addExtraDays_Manual(
        attendance,
        attendanceData,
        createBy,
        createByIp,
        userData.companyMasterId,
        +totaltime,
        transaction
      );
    }
  } else {
    await normal_overtime_Manual(
      empJoing,
      attendance,
      userData.userMasterID,
      get_one_data.AttendanceTransID,
      userData.companyMasterId,
      skipMinutes,
      transaction,
      extraMinutes,
      0
    );
  }

  const transactiondata1 = await attendanceTransaction.findOne({
    where: { AttendanceTransID: get_one_data.AttendanceTransID },
    transaction,
  });
  // Add Food Allowance Bonus
  await addFoodAllowanceInAttendance_Manual(transactiondata1, transaction);

  return transactiondata1;
}

async function newWeekOffDay(
  userData,
  shuffledattendance,
  shuffled,
  transaction,
  createBy,
  createByIp
) {
  if (!shuffledattendance || !shuffledattendance.OutDateTime) {
    return;
  }
  const get_one_data = shuffledattendance;
  const usershortleave = get_one_data?.userShortLeaves?.[0] || null;

  const attendance =
    userData.employeeAttendancePolicies &&
    userData.employeeAttendancePolicies.length > 0
      ? userData.employeeAttendancePolicies[0].attendancePolicy
        ? userData.employeeAttendancePolicies[0].attendancePolicy
        : null
      : null;

  const empJoing =
    userData.employeeJoiningDetails &&
    userData.employeeJoiningDetails.length > 0
      ? userData.employeeJoiningDetails[0]
      : null;

  const salaryPolicy =
    userData.employeeSalaryPolicies &&
    userData.employeeSalaryPolicies.length > 0
      ? userData.employeeSalaryPolicies[0]
      : null;

  const LC_EG_Policy =
    userData.employeeLateEarlyPolicies &&
    userData.employeeLateEarlyPolicies.length > 0
      ? userData.employeeLateEarlyPolicies[0]
      : null;

  await attendanceTransaction.update(
    {
      PanaltyDeduction: null,
      goEarlyUsed: 0,
      goEarlyPanalty: null,
      goEarlyPanaltyDeduction: null,
      earlyPenaltyMinutes: null,
      latePenaltyMinutes: null,
      updateBy: createBy,
    },
    {
      where: {
        AttendanceTransID: get_one_data.AttendanceTransID,
      },
      transaction,
    }
  );

  const attendanceData = await attendanceTransaction.findOne({
    where: {
      AttendanceTransID: get_one_data.AttendanceTransID,
    },
    transaction,
  });
  let totaltime = Math.abs(
    (new Date(attendanceData.OutDateTime) -
      new Date(attendanceData.InDatetime)) /
      (1000 * 60)
  );
  totaltime = Math.round(totaltime - +attendanceData.OutHrs);
  // totaltime = Number(get_one_data.InHrs) + Number(minutes);
  if (
    +userData.companyMasterId == 168 &&
    new Date(attendanceData.InDatetime) <
      new Date(attendanceData.AttendanceDate + ' ' + attendanceData.ShiftIntime)
  ) {
    const difference = Math.abs(
      (new Date(
        attendanceData.AttendanceDate + ' ' + attendanceData.ShiftIntime
      ) -
        new Date(attendanceData.InDatetime)) /
        (1000 * 60)
    );
    totaltime = Math.round(totaltime - +difference);
  }
  let skipMinutes = 0;
  let fulldayHalfdayMinutes = 0;

  if (
    attendance &&
    attendance.considerOvertimeAfter == 'totalworkinghours' &&
    attendance.preShiftHrsConsideration == 0
  ) {
    if (
      new Date(get_one_data.InDatetime) <
      new Date(get_one_data.AttendanceDate + ' ' + get_one_data.ShiftIntime)
    ) {
      const diffMilliseconds =
        new Date(get_one_data.AttendanceDate + ' ' + get_one_data.ShiftIntime) -
        new Date(get_one_data.InDatetime);

      skipMinutes = Math.floor(diffMilliseconds / (1000 * 60));
      // skip minutes from fulldayhalfday minutes

      fulldayHalfdayMinutes -= +skipMinutes;
    }
  }

  let final_Minutes = Math.round(+totaltime);

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
  let grace = 0;

  // if user short leave

  if (usershortleave && attendanceData) {
    await UserShortLeave.update(
      {
        authorizationStatus: 5,
        cancelRemarks: 'cancelled by weekoff shuffle',
      },
      {
        where: {
          date: attendanceData.AttendanceDate,
          userMasterID: attendanceData.userMasterID,
        },
        transaction,
      }
    );
  }
  let withoutOtMinutes = Math.round(+final_Minutes);
  if (attendance && attendance.coff && attendance.coff == 'Overtime') {
    withoutOtMinutes = 0;
    //If Overtime
    await coff_Overtime_Manual(
      attendance,
      get_one_data,
      createBy,
      createByIp,
      skipMinutes,
      transaction
    );
  } else if (attendance && attendance.coff && attendance.coff == 'AddLeave') {
    await coff_addLeave_Manual(
      attendance,
      attendanceData,
      createBy,
      createByIp,
      userData.companyMasterId,
      +totaltime,
      transaction
    );
  } else if (
    attendance &&
    attendance.coff &&
    attendance.coff == 'AddExtraDays'
  ) {
    await coff_addExtraDays_Manual(
      attendance,
      attendanceData,
      createBy,
      createByIp,
      userData.companyMasterId,
      +totaltime,
      transaction
    );
  } else {
    await normal_overtime_Manual(
      empJoing,
      attendance,
      userData.userMasterID,
      get_one_data.AttendanceTransID,
      userData.companyMasterId,
      skipMinutes,
      transaction,
      extraMinutes,
      grace
    );
  }
  await attendanceTransaction.update(
    {
      withoutOtMinutes,
    },
    {
      where: { AttendanceTransID: get_one_data.AttendanceTransID },
      transaction,
    }
  );
  const transactiondata1 = await attendanceTransaction.findOne({
    where: { AttendanceTransID: get_one_data.AttendanceTransID },
    transaction,
  });

  // Add Food Allowance Bonus
  await addFoodAllowanceInAttendance_Manual(transactiondata1, transaction);

  return transactiondata1;
}

exports.changeWeekOff = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { userMasterID, date, isWeekOff } = req.body;
    let yearMonth = date.replace(/-/g, '').slice(0, 6);
    const day = new Date(date).toLocaleString('en-us', {
      weekday: 'long',
    });
    let addedCount = 0;
    //Inclued Model to Get Data (weekoffShuffled)
    const weekoffincludedModels = await getIncludeModels(date);
    weekoffincludedModels.push(
      // Employee Attendance Transaction
      {
        model: attendanceTransaction,
        required: false,
        where: {
          Status: 1,
          AttendanceDate: date,
        },
      },
      //Hr Leave Monthly Transaction
      {
        separate: true,
        required: false,
        model: HrLeaveMonthlyTrans,
        where: {
          AttnYearMon: yearMonth,
          verified: 1,
        },
      },
      //Week OFF Holiday Transaction
      {
        separate: true,
        required: false,
        model: weekoffHolidayTran,
        where: {
          date: date,
          tableName: 'weekoff',
        },
      }
    );
    //Find User Data(weekoffShuffled)
    // Find weekoff Shuffled User
    const getweekoffuserData = await UserMaster.findOne({
      where: {
        userMasterID,
        status: 1,
      },
      include: weekoffincludedModels,
      transaction,
    });

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    //Initialize
    const attendanceVerifedUsers = [];

    // Find Attendace Verification (weekoffShuffled)
    const findweekoffShuffledAttendaceVerification =
      getweekoffuserData &&
      getweekoffuserData.hrLeaveMonthlyTrans &&
      getweekoffuserData.hrLeaveMonthlyTrans.length > 0
        ? getweekoffuserData.hrLeaveMonthlyTrans[0]
        : null;

    // Check for Attendance Verification
    if (findweekoffShuffledAttendaceVerification) {
      await transaction.rollback(); // Commit the transaction
      return res.status(200).json({
        status: 401,
        message: 'Attendace Already Verified.',
        addedCount: addedCount,
      });
    }
    // Find Attendace Transaction (weekoffShuffled)
    const weekoffShuffledattendance =
      getweekoffuserData &&
      getweekoffuserData.attendanceTransactions &&
      getweekoffuserData.attendanceTransactions.length > 0
        ? getweekoffuserData.attendanceTransactions[0]
        : null;

    if (isWeekOff) {
      //Create Week Off Holiday Trans
      await weekoffHolidayTran.create(
        {
          companyMasterID: getweekoffuserData.companyMasterId,
          userMasterID: getweekoffuserData.userMasterID,
          yearMonth: yearMonth,
          date: date,
          dayName: day,
          value: 1,
          tableName: 'weekoff',
          WHDayType: 'FD',
        },
        {
          transaction,
        }
      );
      if (weekoffShuffledattendance && weekoffShuffledattendance.OutDateTime) {
        await newWeekOffDay(
          getweekoffuserData,
          weekoffShuffledattendance,
          date,
          transaction,
          createBy,
          createByIp
        );
      }
    } else {
      //Destroy Week Off Holiday Trans
      await weekoffHolidayTran.destroy({
        where: {
          userMasterID: getweekoffuserData.userMasterID,
          date: date,
          tableName: 'weekoff',
          yearMonth: yearMonth,
        },
        transaction,
      });
      if (weekoffShuffledattendance && weekoffShuffledattendance.OutDateTime) {
        await oldWeekOffDay(
          getweekoffuserData,
          weekoffShuffledattendance,
          date,
          transaction,
          createBy,
          createByIp
        );
      }
    }

    addedCount++;
    let finalMessage = `Total records added successfully: ${addedCount}.`;

    await transaction.commit(); // Commit the transaction
    return res.status(200).json({
      status: 200,
      message: finalMessage,
      addedCount: addedCount,
    });
  } catch (err) {
    await transaction.rollback(); // Rollback the transaction in case of an error
    next(err);
  }
};
