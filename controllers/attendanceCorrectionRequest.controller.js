const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const sequelize = require('../config/database');
const AttendanceCorrectionAuthorization = require('../models/attendanceCorrectionAuthorization');
const AttendanceCorrectionLogs = require('../models/attendanceCorrectionLogs');
const AttendanceCorrectionRequest = require('../models/attendanceCorrectionRequest');
const FormAuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const UserInbox = require('../models/UserInbox');
const UserMaster = require('../models/userMaster');
const {
  sendNotification,
  employeeSalaryPolicy,
  getSalaryMonthBySalaryPolicy,
  daysInMonth,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const { CustomError } = require('../utils/customError');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const Shift = require('../models/shift');
const AttendanceCorrectionReason = require('../models/attendanceCorrectionReason');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const AttendancePolicy = require('../models/attendancePolicy');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const { authorizationMasterTypes } = require('../utils/dbUtils');

exports.addData = async (req, res, next) => {
  try {
    const {
      userMasterID,
      AttendanceDate,
      remark,
      attendaceLogs,
      correctionStatus,
      attendanceCorrectionReasonID,
    } = req.body;

    const findSameData = await AttendanceCorrectionRequest.findOne({
      where: {
        userMasterID,
        AttendanceDate,
        authorizationStatus: {
          [Op.notIn]: [4, 3],
        },
      },
    });

    if (findSameData) {
      return res.status(200).json({
        status: 500,
        message: `You have already requested an attendance correction for ${moment(
          AttendanceDate
        ).format('DD/MM/YYYY')}.`,
      });
    }
    const user_details = await UserMaster.findOne({
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
              [Sequelize.Op.lte]: new Date(AttendanceDate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(AttendanceDate),
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
          required: false,
          separate: true,
          model: EmployeeSalaryPolicy,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(AttendanceDate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(AttendanceDate),
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
      ],
    });
    if (!user_details) {
      return res.status(200).json({
        status: 401,
        message: 'User details not found',
      });
    }
    const user_salaryPolicy =
      user_details.employeeSalaryPolicies?.[0]?.salaryPolicy || null;

    const userAttendancePolicy =
      user_details.employeeAttendancePolicies?.[0]?.attendancePolicy || null;

    if (userAttendancePolicy && userAttendancePolicy.setCorrLimit) {
      const [year, month] = AttendanceDate.split('-');
      let monday = daysInMonth(month, year);
      let start_date = year + '-' + month + '-' + '01';
      let end_date = year + '-' + month + '-' + monday;
      // ----------- set start date and end date according to salary policy -------

      if (user_salaryPolicy) {
        let date = user_salaryPolicy.salaryCycleDate;

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
      }

      const condition = {
        userMasterID,
      };

      if (start_date && end_date)
        condition.AttendanceDate = {
          [Op.between]: [start_date, end_date],
        };

      const attendanceCorrectionRequests =
        await AttendanceCorrectionRequest.count({
          distinct: true,
          where: condition,
          order: [['AttendanceDate', 'DESC']],
        });

      if (attendanceCorrectionRequests >= userAttendancePolicy.attCorrLimit) {
        return res.status(200).json({
          status: 500,
          message: `You have Reached Attendance Correction Request Limit.`,
        });
      }
    }

    const yearmonth = await getSalaryMonthBySalaryPolicy(
      user_salaryPolicy ? true : false,
      user_salaryPolicy ? user_salaryPolicy.salaryCycleDate : '',
      user_salaryPolicy ? user_salaryPolicy.salaryCycleConsider : '',
      AttendanceDate
    );

    const attendance_verified = await HrLeaveMonthlyTrans.findOne({
      where: {
        userMasterID: userMasterID,
        AttnYearMon: yearmonth,
        verified: 1,
      },
    });

    if (attendance_verified) {
      return res.status(200).json({
        status: 500,
        message:
          'Attendance has already been verified. You cannot request a correction at this time.',
      });
    }

    const authorizationdetails = await FormAuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.attendanceCorrection, // Attendance Correction
        userMasterID,
        status: 1,
      },
      include: [
        {
          model: AuthorizationCriteriaMaster,
          attributes: ['AuthorizationCriteria'],
        },
      ],
    });

    const authorizationStatus =
      // eslint-disable-next-line no-nested-ternary
      authorizationdetails && authorizationdetails.AuthorizationCriteriaMaster
        ? authorizationdetails.AuthorizationCriteriaMaster
            .AuthorizationCriteria == 'Sequeance No'
          ? 2
          : 1
        : 0;

    await sequelize.transaction(async (t) => {
      // Add Attendance Correction Request
      const requestData = await AttendanceCorrectionRequest.create(
        {
          userMasterID,
          AttendanceDate,
          remark,
          authorizationStatus,
          correctionStatus,
          attendanceCorrectionReasonID,
        },
        { user: req.userDetails, transaction: t }
      );

      // Set Attendance RequestId In Log Data
      for (let i = 0; i < attendaceLogs.length; i++) {
        attendaceLogs[i].attendanceCorrectionRequestId =
          requestData.attendanceCorrectionRequestId;
      }
      // Create Attendance Correction Log
      await AttendanceCorrectionLogs.bulkCreate(attendaceLogs, {
        user: req.userDetails,
        individualHooks: true,
        transaction: t,
      });

      // if authorization is set
      if (+authorizationStatus !== 0) {
        // user Details
        const userDetails = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID,
          },
        });

        if (!userDetails) throw new Error('User not found!');

        // For Sequence No
        if (+authorizationStatus === 2) {
          const authorizationData =
            await AttendanceCorrectionAuthorization.create(
              {
                TableName: 'Attendance Correction',
                attendanceCorrectionRequestId:
                  requestData.attendanceCorrectionRequestId,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
                authStatus: 2,
              },
              { user: req.userDetails, transaction: t }
            );

          // Create UserInbox
          await UserInbox.create(
            {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: authorizationData.toJSON().id,
              message: `${
                userDetails.displayName
              } has requested an attendance correction for ${moment(
                AttendanceDate
              ).format('DD/MM/YYYY')}.`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
              assignedBy: userMasterID,
            },
            { user: req.userDetails, transaction: t }
          );

          const notification = {
            title: 'Attendance Correction',
            body:
              userDetails.displayName +
              ' requested for an attendance correction.',
          };
          const data = {
            screen: 'attendanceCorrectionauth',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };
          // send Notification
          await sendNotification(
            authorizationData.userMasterID,
            notification,
            data
          );
        } else {
          // For Any
          for (
            let j = 0;
            j < authorizationdetails.AuthorizedByUserMasterId.length;
            j += 1
          ) {
            const authorizationData =
              await AttendanceCorrectionAuthorization.create(
                {
                  TableName: 'Attendance Correction',
                  attendanceCorrectionRequestId:
                    requestData.attendanceCorrectionRequestId,
                  userMasterID:
                    authorizationdetails.AuthorizedByUserMasterId[j],
                  authStatus: 2,
                },
                { user: req.userDetails, transaction: t }
              );

            // Create UserInbox
            await UserInbox.create(
              {
                activityTable: AttendanceCorrectionAuthorization.getTableName(),
                activityTablePK: authorizationData.toJSON().id,
                message: `${
                  userDetails.displayName
                } has requested an attendance correction for ${moment(
                  AttendanceDate
                ).format('DD/MM/YYYY')}.`,
                assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
                assignedBy: userMasterID,
              },
              { user: req.userDetails, transaction: t }
            );

            const notification = {
              title: 'Attendance Correction',
              body:
                userDetails.displayName +
                ' requested for an attendance correction.',
            };
            const data = {
              screen: 'attendanceCorrectionauth',
              isScheduled: 'true',
              scheduledTime: new Date().toISOString(),
            };
            // send Notification
            await sendNotification(
              authorizationData.userMasterID,
              notification,
              data
            );
          }
        }
      }
    });

    return res.status(200).json({
      status: 200,
      message: 'Your attendance correction request has been sent successfully!',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      userMasterID,
      AttendanceDate,
      remark,
      attendaceLogs,
      correctionStatus,
      attendanceCorrectionReasonID,
    } = req.body;

    const findSameData = await AttendanceCorrectionRequest.findOne({
      where: {
        userMasterID,
        AttendanceDate,
        attendanceCorrectionRequestId: {
          [Op.not]: id,
        },
        authorizationStatus: {
          [Op.notIn]: [4, 3],
        },
      },
    });

    if (findSameData) {
      return res.status(200).json({
        status: 500,
        message: `You have already requested an attendance correction for ${moment(
          AttendanceDate
        ).format('DD/MM/YYYY')}.`,
      });
    }

    const user_salaryPolicy = await employeeSalaryPolicy(
      userMasterID,
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
        userMasterID: userMasterID,
        AttnYearMon: yearmonth,
        verified: 1,
      },
    });

    if (attendance_verified) {
      return res.status(200).json({
        status: 500,
        message:
          'Attendance has already been verified. You cannot request a correction at this time.',
      });
    }

    const authorizationdetails = await FormAuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.attendanceCorrection, // Attendance Correction
        userMasterID,
        status: 1,
      },
      include: [
        {
          model: AuthorizationCriteriaMaster,
          attributes: ['AuthorizationCriteria'],
        },
      ],
    });

    const authorizationStatus =
      authorizationdetails && authorizationdetails.AuthorizationCriteriaMaster
        ? authorizationdetails.AuthorizationCriteriaMaster
            .AuthorizationCriteria == 'Sequeance No'
          ? 2
          : 1
        : 0;

    await sequelize.transaction(async (t) => {
      const requestData = await AttendanceCorrectionRequest.findOne({
        where: {
          attendanceCorrectionRequestId: id,
        },
      });

      if (!requestData) throw new Error('Request is deleted!');

      requestData.authorizationStatus = authorizationStatus;
      requestData.AttendanceDate = AttendanceDate;
      requestData.remark = remark;
      requestData.correctionStatus = correctionStatus;
      requestData.attendanceCorrectionReasonID = attendanceCorrectionReasonID;

      // Update Attendance Correction Request
      await requestData.save({ user: req.userDetails, transaction: t });

      // Delete All Logs

      await AttendanceCorrectionLogs.destroy(
        {
          where: {
            attendanceCorrectionRequestId: id,
          },
        },
        { user: req.userDetails, individualHooks: true, transaction: t }
      );

      attendaceLogs.map((e) => {
        e.attendanceCorrectionRequestId = id;
      });
      // Create Attendance Correction Log
      await AttendanceCorrectionLogs.bulkCreate(attendaceLogs, {
        user: req.userDetails,
        individualHooks: true,
        transaction: t,
      });

      // Find Auth data
      const findAuthData = await AttendanceCorrectionAuthorization.findAll({
        where: {
          attendanceCorrectionRequestId: id,
        },
      });

      const authids = findAuthData.map((e) => e.id);

      // Delete Inbox Data
      await UserInbox.destroy(
        {
          where: {
            activityTable: AttendanceCorrectionAuthorization.getTableName(),
            activityTablePK: authids,
          },
        },
        { transaction: t }
      );

      // ``Delete Authorization
      await AttendanceCorrectionAuthorization.destroy({
        where: { id: authids },
        individualHooks: true,
        transaction: t,
        user: req.userDetails,
      });

      // if authorization is set
      if (+authorizationStatus !== 0) {
        // user Details
        const userDetails = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID,
          },
        });

        if (!userDetails) throw new Error('User not found!');

        // For Sequence No
        if (+authorizationStatus === 2) {
          const authorizationData =
            await AttendanceCorrectionAuthorization.create(
              {
                TableName: 'Attendance Correction',
                attendanceCorrectionRequestId:
                  requestData.attendanceCorrectionRequestId,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
                authStatus: 2,
              },
              { user: req.userDetails, transaction: t }
            );

          // Create UserInbox
          await UserInbox.create(
            {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: authorizationData.toJSON().id,
              message: `${
                userDetails.displayName
              } has requested an attendance correction for ${moment(
                AttendanceDate
              ).format('DD/MM/YYYY')}.`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
              assignedBy: userMasterID,
            },
            { user: req.userDetails, transaction: t }
          );

          const notification = {
            title: 'Attendance Correction',
            body:
              userDetails.displayName +
              ' requested for an attendance correction.',
          };
          const data = {
            screen: 'attendanceCorrectionauth',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };
          // send Notification
          await sendNotification(
            authorizationData.userMasterID,
            notification,
            data
          );
        } else {
          // For Any
          for (
            let j = 0;
            j < authorizationdetails.AuthorizedByUserMasterId.length;
            j++
          ) {
            const authorizationData =
              await AttendanceCorrectionAuthorization.create(
                {
                  TableName: 'Attendance Correction',
                  attendanceCorrectionRequestId:
                    requestData.attendanceCorrectionRequestId,
                  userMasterID:
                    authorizationdetails.AuthorizedByUserMasterId[j],
                  authStatus: 2,
                },
                { user: req.userDetails, transaction: t }
              );

            // Create UserInbox
            await UserInbox.create(
              {
                activityTable: AttendanceCorrectionAuthorization.getTableName(),
                activityTablePK: authorizationData.toJSON().id,
                message: `${
                  userDetails.displayName
                } has requested an attendance correction for ${moment(
                  AttendanceDate
                ).format('DD/MM/YYYY')}.`,
                assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
                assignedBy: userMasterID,
              },
              { user: req.userDetails, transaction: t }
            );

            const notification = {
              title: 'Attendance Correction',
              body:
                userDetails.displayName +
                ' requested for an attendance correction.',
            };
            const data = {
              screen: 'attendanceCorrectionauth',
              isScheduled: 'true',
              scheduledTime: new Date().toISOString(),
            };
            // send Notification
            await sendNotification(
              authorizationData.userMasterID,
              notification,
              data
            );
          }
        }
      }
    });

    return res.status(200).json({
      status: 200,
      message:
        'An attendance correction request has been updated successfully!',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const requestData = await AttendanceCorrectionRequest.findOne({
      where: {
        attendanceCorrectionRequestId: id,
      },
    });

    if (!requestData) throw new CustomError('Record is deleted!', 401);

    await sequelize.transaction(async (t) => {
      await AttendanceCorrectionLogs.destroy(
        {
          where: {
            attendanceCorrectionRequestId:
              requestData.attendanceCorrectionRequestId,
          },
        },
        { user: req.userDetails, individualHooks: true, transaction: t }
      );

      const authData = await AttendanceCorrectionAuthorization.findAll({
        where: {
          attendanceCorrectionRequestId:
            requestData.attendanceCorrectionRequestId,
        },
      });

      const authids = authData.map((e) => e.id);

      // Delete Inbox Data
      await UserInbox.destroy(
        {
          where: {
            activityTable: AttendanceCorrectionAuthorization.getTableName(),
            activityTablePK: authids,
          },
        },
        { transaction: t }
      );

      await AttendanceCorrectionAuthorization.destroy({
        where: {
          id: authids,
        },
        user: req.userDetails,
        individualHooks: true,
        transaction: t,
      });

      await requestData.destroy({
        user: req.userDetails,
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      message:
        'An attendance correction request has been deleted successfully!',
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const requestData = await AttendanceCorrectionRequest.findOne({
      where: {
        attendanceCorrectionRequestId: id,
      },
      include: [
        {
          model: AttendanceCorrectionLogs,
          include: [{ model: Shift, attributes: ['shiftName'] }],
        },
        {
          required: false,
          model: AttendanceCorrectionReason,
        },
        {
          model: UserMaster,
          as: 'employee',
          attributes: ['userMasterID', 'displayName', 'userNumber'],
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
    });

    return res.status(200).json({
      status: 200,
      data: requestData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getByUserId = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      userMasterID,
      startDate,
      endDate,
      attendanceCorrectionReasonID,
    } = req.body;

    const paginateCodition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      userMasterID,
    };

    if (attendanceCorrectionReasonID) {
      condition.attendanceCorrectionReasonID = attendanceCorrectionReasonID;
    }

    if (startDate && endDate)
      condition.AttendanceDate = {
        [Op.between]: [startDate, endDate],
      };

    const { rows: requestData, count: totalcount } =
      await AttendanceCorrectionRequest.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginateCodition,
        include: [
          { model: AttendanceCorrectionLogs },
          {
            model: AttendanceCorrectionAuthorization,
            attributes: ['id', 'status', 'authStatus', 'remarks'],
          },
          {
            required: false,
            model: AttendanceCorrectionReason,
          },
        ],
        order: [['AttendanceDate', 'DESC']],
      });

    return res.status(200).json({
      status: 200,
      data: requestData,
      totalcount,
    });
  } catch (error) {
    next(error);
  }
};
