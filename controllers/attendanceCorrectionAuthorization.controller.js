const UserMaster = require('../models/userMaster');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const Sequelize = require('sequelize');
const EmployeeBranch = require('../models/employeeBranch');
const AttendanceCorrectionRequest = require('../models/attendanceCorrectionRequest');
const AttendanceCorrectionAuthorization = require('../models/attendanceCorrectionAuthorization');
const sequelize = require('../config/database');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const moment = require('moment');
const AttendanceCorrectionLogs = require('../models/attendanceCorrectionLogs');

const {
  accessibleUsers,
  sendNotification,
  asiaKolkataDateTime,
  employeeSalaryPolicy,
  getSalaryMonthBySalaryPolicy,
  manualAttendnace_Latest,
} = require('../utils/commonUtilFunctions');
const UserInbox = require('../models/UserInbox');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');

const attendanceTransaction = require('../models/attendanceTransaction');
const AttendanceLogs = require('../models/attendancelogs');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const { authorizationMasterTypes } = require('../utils/dbUtils');

function formatLogDateTime(datetime) {
  // Create a new Date object from the input
  const dateObj = new Date(datetime);

  // Get the components of the date
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  // Format the date and time to the required format "YYYY-MM-DDTHH:mm"
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

exports.authorizationacceptrejectAttendanceCorrection = async (
  req,
  res,
  next
) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      id,
      remarks,
      authstatus,
      attendanceCorrectionRequestId,
      userMasterID,
    } = req.body;

    let addAttendnaceFlag = false;

    const authRequest = await AttendanceCorrectionAuthorization.findOne({
      where: { id },
      include: [{ model: AttendanceCorrectionRequest }],
      transaction,
    });

    if (!authRequest) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization request not found' });
    }

    if (authstatus == 1) {
      const userId = authRequest.attendanceCorrectionRequest.userMasterID;
      const AttendanceDate =
        authRequest.attendanceCorrectionRequest.AttendanceDate;

      const user_salaryPolicy = await employeeSalaryPolicy(
        userId,
        AttendanceDate
      );

      const yearmonth = await getSalaryMonthBySalaryPolicy(
        user_salaryPolicy ? true : false,
        user_salaryPolicy
          ? user_salaryPolicy['salaryPolicy.salaryCycleDate']
          : '',
        user_salaryPolicy
          ? user_salaryPolicy['salaryPolicy.salaryCycleConsider']
          : '',
        AttendanceDate
      );

      const attendance_verified = await HrLeaveMonthlyTrans.findOne({
        where: {
          userMasterID: userId,
          AttnYearMon: yearmonth,
          verified: 1,
        },
        transaction,
      });

      if (attendance_verified) {
        await transaction.rollback();
        return res.status(200).json({
          status: 500,
          message:
            'Attendance has already been verified. You cannot request a correction at this time.',
        });
      }
    }

    const allAuthData = await AttendanceCorrectionAuthorization.findAll({
      where: { attendanceCorrectionRequestId },
      include: [{ model: AttendanceCorrectionRequest }],
      transaction,
    });

    const allAuthIds = allAuthData.map((e) => e.id);
    const approvedRequests = allAuthData.filter((e) => e.authStatus == 1);
    const authorizationMaster = await AuthorizationMaster.findOne({
      where: {
        authorizationMasterID: authorizationMasterTypes.attendanceCorrection,
      },
      transaction,
    });

    if (!authorizationMaster) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization Master not found' });
    }

    const authorizationDetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMaster.authorizationMasterID,
        userMasterID: authRequest.attendanceCorrectionRequest.userMasterID,
        status: 1,
      },
      transaction,
    });

    if (!authorizationDetails) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization details not found' });
    }

    const authorizationCriteria = await AuthorizationCriteria.findOne({
      where: {
        AuthorizationCriteriaID: authorizationDetails.AuthorizationCriteriaID,
        status: 1,
      },
      transaction,
    });

    if (!authorizationCriteria) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization criteria not found' });
    }

    const date = authRequest.attendanceCorrectionRequest.AttendanceDate;

    const userinfo = await UserMaster.findOne({
      where: {
        userMasterID: authRequest.attendanceCorrectionRequest.userMasterID,
      },
      include: [
        {
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
        },
        {
          required: false,
          model: EmployeeDesignation,
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
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          attributes: ['designationID'],
        },
        {
          model: EmployeeDepartment,
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
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['departmentID'],
        },
      ],
    });

    if (authorizationCriteria.AuthorizationCriteria === 'Sequeance No') {
      if (authstatus === 0) {
        await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
          },
          { transaction }
        );

        await AttendanceCorrectionRequest.update(
          { authorizationStatus: 4 },
          { where: { attendanceCorrectionRequestId }, transaction }
        );
      } else {
        await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
          },
          { transaction }
        );

        const authRequests = allAuthData.filter((e) => e.authStatus != 0);

        const approvedUserIds = authRequests.map((req) =>
          req.userMasterID.toString()
        );

        const formAuthUsers = authorizationDetails.AuthorizedByUserMasterId.map(
          (id) => id.toString()
        );

        const remainingUserIds = formAuthUsers.filter(
          (id) => !approvedUserIds.includes(id)
        );

        if (remainingUserIds.length > 0) {
          const attendanceAuth = await AttendanceCorrectionAuthorization.create(
            {
              attendanceCorrectionRequestId,
              userMasterID: remainingUserIds[0],
              status: 1,
              authStatus: 2,
            },
            { user: req.userDetails, transaction }
          );

          await UserInbox.create(
            {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: attendanceAuth.toJSON().id,
              message: `${
                userinfo.displayName
              } has requested an attendance correction for ${moment(
                authRequest.attendanceCorrectionRequest.AttendanceDate
              ).format('DD/MM/YYYY')}.`,
              assignedTo: remainingUserIds[0],
              assignedBy: userinfo.userMasterID,
            },
            { transaction }
          );

          const notification = {
            title: 'Attendance Correction',
            body:
              userinfo.displayName + ' requested for an attendance correction.',
          };
          const data = {
            screen: 'attendanceCorrectionauth',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };

          await sendNotification(remainingUserIds[0], notification, data);
        } else {
          addAttendnaceFlag = true;
          await AttendanceCorrectionRequest.update(
            { authorizationStatus: 3 },
            { where: { attendanceCorrectionRequestId }, transaction }
          );
        }
      }
    } else if (authorizationCriteria.AuthorizationCriteria === 'Any One') {
      if (authstatus === 0) {
        await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
          },
          { transaction }
        );

        await AttendanceCorrectionRequest.update(
          { authorizationStatus: 4 },
          { where: { attendanceCorrectionRequestId }, transaction }
        );
      } else {
        await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: id,
            },
          },
          { transaction }
        );
        if (approvedRequests.length + 1 >= 1) {
          addAttendnaceFlag = true;
          await UserInbox.destroy(
            {
              where: {
                activityTable: AttendanceCorrectionAuthorization.getTableName(),
                activityTablePK: allAuthIds,
              },
            },
            { transaction }
          );

          await AttendanceCorrectionRequest.update(
            { authorizationStatus: 3 },
            { where: { attendanceCorrectionRequestId }, transaction }
          );
        }
      }
    } else if (authorizationCriteria.AuthorizationCriteria === 'Any Two') {
      if (authstatus === 0) {
        await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
          },
          { transaction }
        );

        await AttendanceCorrectionRequest.update(
          { authorizationStatus: 4 },
          { where: { attendanceCorrectionRequestId }, transaction }
        );
      } else {
        await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: id,
            },
          },
          { transaction }
        );

        if (approvedRequests.length + 1 >= 2) {
          addAttendnaceFlag = true;
          await UserInbox.destroy(
            {
              where: {
                activityTable: AttendanceCorrectionAuthorization.getTableName(),
                activityTablePK: allAuthIds,
              },
            },
            { transaction }
          );
          await AttendanceCorrectionRequest.update(
            { authorizationStatus: 3 },
            { where: { attendanceCorrectionRequestId }, transaction }
          );
        }
      }
    } else {
      if (authstatus === 0) {
        await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
          },
          { transaction }
        );

        await AttendanceCorrectionRequest.update(
          { authorizationStatus: 4 },
          { where: { attendanceCorrectionRequestId }, transaction }
        );
      } else {
        await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: id,
            },
          },
          { transaction }
        );

        if (approvedRequests.length + 1 >= 3) {
          addAttendnaceFlag = true;
          await UserInbox.destroy(
            {
              where: {
                activityTable: AttendanceCorrectionAuthorization.getTableName(),
                activityTablePK: allAuthIds,
              },
            },
            { transaction }
          );
          await AttendanceCorrectionRequest.update(
            { authorizationStatus: 3 },
            { where: { attendanceCorrectionRequestId }, transaction }
          );
        }
      }
    }

    // For final Approve
    if (addAttendnaceFlag) {
      const attendanceCorrectionLogs = await AttendanceCorrectionLogs.findAll({
        where: {
          attendanceCorrectionRequestId,
        },
      });

      if (attendanceCorrectionLogs.length === 0) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: 'Attendance Correction Logs not found!',
        });
      }

      const attendanceType = attendanceCorrectionLogs[0].attendanceStatus
        ? '1'
        : '3';
      const companyMasterID = userinfo.companyMasterId;
      const branchMasterID =
        userinfo.employeeBranches && userinfo.employeeBranches.length > 0
          ? userinfo.employeeBranches[0].branchID
          : null;
      const departmentID =
        userinfo.employeeDepartments && userinfo.employeeDepartments.length > 0
          ? userinfo.employeeDepartments[0].departmentID
          : null;
      const designationID =
        userinfo.employeeDesignations &&
        userinfo.employeeDesignations.length > 0
          ? userinfo.employeeDesignations[0].designationID
          : null;
      const createBy = req.userDetails.userMasterId;
      const createByIp = req.userDetails.userIpAddress;

      const attendance = await attendanceTransaction.findOne({
        where: {
          userMasterID: userinfo.userMasterID,
          AttendanceDate:
            authRequest.attendanceCorrectionRequest.AttendanceDate,
        },
        include: [
          {
            required: false,
            model: AttendanceLogs,
            order: [['logDateTime', 'ASC']],
          },
        ],
      });

      const finaldataarray = [];

      const obj = {
        IN_Change: true,
        Name: userinfo.displayName,
        OUT_Change: true,
        Shift: null,
        Userid: userinfo.userMasterID,
        attendanceTransid: attendance ? attendance.AttendanceTransID : null,
        attendanceType: 0,
        attendance_date: authRequest.attendanceCorrectionRequest.AttendanceDate,
        branchMasterID: branchMasterID,
        departmentId: departmentID,
        designationId: designationID,
        attendanceLogs: [],
        attendanceLogData: [],
      };

      function sortLogsByDateTime(logData) {
        const data = logData.sort((a, b) => {
          const dateA = new Date(a.logDateTime).getTime();
          const dateB = new Date(b.logDateTime).getTime();
          return dateA - dateB; // Ascending order
        });

        return data;
      }

      if (attendanceType == 3) {
        const attendanceLogs =
          attendance && attendance.attendancelogs
            ? sortLogsByDateTime(attendance.attendancelogs)
            : [];
        obj.attendanceLogs = attendanceLogs;

        const formatedAttendanceLogs = attendanceCorrectionLogs.map((e) => {
          return {
            logId: e.logId,
            logDateTime: formatLogDateTime(e.logDateTime),
            direction: String(e.direction).toLocaleLowerCase(),
            isEdited: e.isChangeLog,
            isdeleted: false,
          };
        });

        obj.attendanceLogData = formatedAttendanceLogs || [];
      }

      if (attendanceType == 1)
        (obj.Shift = attendanceCorrectionLogs[0].shiftID),
          (obj.attendanceType =
            attendanceCorrectionLogs[0].attendanceStatus == 'P'
              ? 1
              : attendanceCorrectionLogs[0].attendanceStatus == 'HD'
                ? 0.5
                : 0);

      finaldataarray.push(obj);

      await manualAttendnace_Latest(
        attendanceType,
        finaldataarray,
        companyMasterID,
        createBy,
        createByIp,
        transaction
      );
    }

    await AttendanceCorrectionAuthorization.update(
      { authStatus: authstatus, remarks, updateBy: userMasterID },
      { where: { id }, transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message:
        authstatus === 1
          ? 'Attendance Correction Authorization Request Accepted Successfully'
          : 'Attendance Correction Authorization Request Rejected Successfully',
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.viewAuthorizationRequestByUserIdForAttendanceCorrection = async (
  req,
  res,
  next
) => {
  try {
    const { limit, page, startdate, enddate, userMasterID, user, status } =
      req.body;

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      status: 1,
      userMasterID,
      '$attendanceCorrectionRequest.status$': 1,
    };

    if (status !== null && status !== undefined) {
      condition.authStatus = status;
      if (+status === 2) {
        condition['$attendanceCorrectionRequest.authorizationStatus$'] = {
          [Sequelize.Op.notIn]: [3, 4],
        };
      } else if (+status === 1) {
        condition['$attendanceCorrectionRequest.authorizationStatus$'] = {
          [Sequelize.Op.in]: [3],
        };
      } else if (+status === 0) {
        condition['$attendanceCorrectionRequest.authorizationStatus$'] = {
          [Sequelize.Op.in]: [4],
        };
      }
    }

    if (user && user.length > 0) {
      condition['$attendanceCorrectionRequest.userMasterID$'] = {
        [Sequelize.Op.in]: user,
      };
    }

    if (startdate && enddate) {
      condition['$attendanceCorrectionRequest.AttendanceDate$'] = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const attendanceCorrectionAuthorization =
      await AttendanceCorrectionAuthorization.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginateCondition,
        order: [['createdAt', 'DESC']],
        include: [
          {
            required: true,
            model: AttendanceCorrectionRequest,
            include: [
              {
                model: UserMaster,
                as: 'employee',
                attributes: [
                  'userMasterID',
                  'displayName',
                  'userNumber',
                  'photo',
                ],
                include: [
                  {
                    separate: true,
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
                    separate: true,
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
                    separate: true,
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
                    separate: true,
                    required: false,
                    model: EmployeeJoiningDetails,
                    attributes: ['employeeCode'],
                  },

                  {
                    required: false,
                    separate: true,
                    model: EmployeeDivision,
                    where: {
                      status: 1,
                      startDate: { [Sequelize.Op.lte]: filterDate },
                      [Sequelize.Op.or]: [
                        { endDate: { [Sequelize.Op.gte]: filterDate } },
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
                    separate: true,
                    model: EmployeeWorkingArea,
                    where: {
                      status: 1,
                      startDate: { [Sequelize.Op.lte]: filterDate },
                      [Sequelize.Op.or]: [
                        { endDate: { [Sequelize.Op.gte]: filterDate } },
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
                ],
              },
            ],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: attendanceCorrectionAuthorization.rows,
      totalcount: attendanceCorrectionAuthorization.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuthorizationRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const authorizationRequest = await AttendanceCorrectionRequest.findOne({
      where: { attendanceCorrectionRequestId: id },
      include: [
        {
          model: UserMaster,
          as: 'employee',
          attributes: ['userMasterID', 'displayName'],
          include: [
            {
              required: false,
              model: AuthorizationDetails,
              as: 'authorizationDetails',
              where: {
                status: 1,
                AuthorizationMasterID:
                  authorizationMasterTypes.attendanceCorrection,
              },
              attributes: ['AuthorizationCriteriaID'],
              include: [
                {
                  model: AuthorizationCriteria,
                  as: 'AuthorizationCriteriaMaster',
                  attributes: ['AuthorizationCriteria'],
                },
              ],
            },
          ],
        },
      ],
    });

    const { AttendanceDate, authorizationStatus, userMasterID, employee } =
      authorizationRequest;

    const { displayName, authorizationDetails } = employee;
    const authCriteriaID =
      authorizationDetails && authorizationDetails.length > 0
        ? authorizationDetails[0].AuthorizationCriteriaID
        : null;

    const authCriteria = await AuthorizationCriteria.findOne({
      where: { AuthorizationCriteriaID: authCriteriaID },
      attributes: ['AuthorizationCriteria'],
    });

    const authUserStatuses = await AttendanceCorrectionAuthorization.findAll({
      where: { attendanceCorrectionRequestId: id },
    });

    const userMasterIDs = authUserStatuses.map((item) => item.userMasterID);

    const users = await UserMaster.findAll({
      where: { userMasterID: userMasterIDs },
      attributes: ['userMasterID', 'displayName'],
    });

    const userMap = new Map(
      users.map((user) => [user.userMasterID.toString(), user.displayName])
    );

    const authUserStatusData = authUserStatuses.map((status) => ({
      userMasterID: status.userMasterID,
      displayName: userMap.get(status.userMasterID.toString()),
      authstatus: status.authStatus,
      remarks: status.remarks,
      updatedAt: status.updatedAt,
    }));

    const responseData = {
      userMasterID,
      AttendanceDate,
      authorizationStatus,
      displayName,
      AuthorizationCriteria: authCriteria
        ? authCriteria.AuthorizationCriteria
        : '',
      authUserStatus:
        authUserStatusData && authUserStatusData.length > 0
          ? authUserStatusData
          : [],
    };

    return res.status(200).json({ status: 200, data: responseData });
  } catch (error) {
    next(error);
  }
};

exports.AttendanceCorrectionAuthorizeduser = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID, authPersonid } = req.body;

    const userDetails = req.userDetails;
    let userdata;

    if (!userDetails.accessibleBranches) {
      userDetails.accessibleBranches = [];
    }

    if (!userDetails.accessibleCompanies) {
      userDetails.accessibleCompanies = [];
    }

    if (branchMasterID === '') {
      const authPerson = await AuthorizationDetails.findAll({
        where: {
          AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [authPersonid] },
          AuthorizationMasterID: authorizationMasterTypes.attendanceCorrection,
          status: 1,
          companyMasterID: companyMasterID,
        },
        include: {
          model: UserMaster,
          required: true,
          ...accessibleUsers(userDetails),
        },
      });

      const userid = authPerson.map((person) => person.userMasterID);

      userdata = await UserMaster.findAll({
        where: {
          userMasterID: { [Sequelize.Op.in]: userid },
          status: 1,
        },
        attributes: [
          ['userMasterID', 'userMasterID'],
          ['displayName', 'userName'],
          ['userNumber', 'Number'],
        ],
      });
    } else {
      const branchContact = await EmployeeBranch.findAll({
        raw: true,
        where: {
          status: 1,
          branchID: branchMasterID,
          applicableDate: { [Sequelize.Op.lte]: new Date() },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.eq]: null } },
            { endDate: { [Sequelize.Op.gte]: new Date() } },
          ],
        },
      });

      const branchuser = branchContact.map((contact) => contact.userMasterID);

      const authPerson = await AuthorizationDetails.findAll({
        where: {
          AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [authPersonid] },
          AuthorizationMasterID: authorizationMasterTypes.attendanceCorrection,
          status: 1,
          userMasterID: { [Sequelize.Op.in]: branchuser },
        },
        include: {
          model: UserMaster,
          required: true,
          ...accessibleUsers(userDetails),
        },
      });

      const userid = authPerson.map((person) => person.userMasterID);

      userdata = await UserMaster.findAll({
        where: {
          userMasterID: { [Sequelize.Op.in]: userid },
          status: 1,
        },
        attributes: [
          ['userMasterID', 'userMasterID'],
          ['displayName', 'userName'],
          ['userNumber', 'Number'],
        ],
      });
    }

    return res.status(200).json({
      status: 200,
      data: userdata,
    });
  } catch (err) {
    next(err);
  }
};
