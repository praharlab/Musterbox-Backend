const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserShortLeave = require('../models/userShortLeave');
const ShortLeaveAuthorization = require('../models/shortLeaveAuthorization');
const UserMaster = require('../models/userMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const EmployeeShortLeavePolicy = require('../models/employeeShortLeavePolicy');
const ShortLeave = require('../models/shortLeave');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const attendanceTransaction = require('../models/attendanceTransaction');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const { error } = require('winston');
const Shift = require('../models/shift');
const {
  sendNotification,
  asiaKolkataDateTime,
  daysInMonth,
} = require('../utils/commonUtilFunctions');
const UserInbox = require('../models/UserInbox');
const { executeQuery } = require('./common.controller');
const moment = require('moment');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const { authorizationMasterTypes } = require('../utils/dbUtils');

async function checkShortLeaveAcceptValidation(userDetails, date, referenceId) {
  let message = null,
    attendanceStatus = null;

  if (!userDetails) return;

  // To Find Day
  const day = new Date(date).toLocaleString('en-us', {
    weekday: 'long',
  });

  // Check if the date is in the future or current

  if (
    new Date(date).getTime() >=
    new Date(asiaKolkataDateTime(new Date()).slice(0, 10)).getTime()
  ) {
    return {
      message: 'Short leave can only be approved for past dates.',
      attendanceStatus,
    };
  }

  const weekoffHoliday = userDetails.weekoffHolidayTrans[0] || null;

  if (weekoffHoliday)
    return {
      message: 'Short leave cannot be approved on a Weekoff/Holiday ',
      attendanceStatus,
    };

  const attendance = userDetails.attendanceTransactions[0] || null;

  if (!attendance)
    return {
      message: `No attendance record found for ${date}.`,
      attendanceStatus,
    };

  if (attendance.fulldayhalfday == 1)
    return {
      message: `You are already marked present on ${date}. Short leave approve is not allowed.`,
      attendanceStatus,
    };

  if (!attendance.OutDateTime)
    return {
      message: `Out time is not recorded for ${date}. Short leave approve cannot be processed.`,
      attendanceStatus,
    };

  const verifiedData = userDetails.hrLeaveMonthlyTrans[0] || null;

  // if verified data found
  if (verifiedData)
    return {
      message:
        'You cannot approve short leave as your attendance has already been verified. ',
      attendanceStatus,
    };

  const shortLeavePolicy =
    userDetails.employeeShortLeavePolicies?.[0]?.shortLeave || null;

  // Check Short Leave Policy assign or not
  if (!shortLeavePolicy)
    return {
      message: 'Please assign a short leave policy before approving.',
      attendanceStatus,
    };

  const salaryPolicy =
    userDetails.employeeSalaryPolicies?.[0]?.salaryPolicy || null;

  let monday = daysInMonth(date.slice(5, 7), date.slice(0, 4));

  let startDate = date.slice(0, 8) + '01',
    endDate = date.slice(0, 8) + monday;

  // if salary policy is available
  if (salaryPolicy) {
    let salaryDate = salaryPolicy.salaryCycleDate;
    startDate = startDate.slice(0, 8) + String(salaryDate).padStart(2, '0');

    // To Check salary consider Month

    if (salaryPolicy.salaryCycleConsider == 'E') {
      const tempDate = new Date(startDate);
      tempDate.setMonth(tempDate.getMonth() - 1);

      startDate =
        tempDate.getFullYear() +
        '-' +
        String(tempDate.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(tempDate.getDate()).padStart(2, '0');

      // set Month days
      monday = daysInMonth(startDate.slice(5, 7), startDate.slice(0, 4));
    }

    // Calculate the end date
    const startDateObj = new Date(startDate);
    startDateObj.setDate(startDateObj.getDate() + (monday - 1));

    endDate = `${startDateObj.getFullYear()}-${String(
      startDateObj.getMonth() + 1
    ).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
  }

  const shortleaveCondition = {
    userMasterID: userDetails.userMasterID,
    date: {
      [Sequelize.Op.between]: [startDate, endDate],
    },
    authorizationStatus: {
      [Sequelize.Op.notIn]: [4, 5],
    },
    userShortLeaveId: {
      [Sequelize.Op.ne]: referenceId,
    },
  };

  const findUsedShortLeaveCount = await UserShortLeave.count({
    where: shortleaveCondition,
  });

  // if used slot leave is greater than to allowed short leave
  if (+findUsedShortLeaveCount >= +shortLeavePolicy.noOfShortLeave)
    return {
      message: `You have reached your limit of ${shortLeavePolicy.noOfShortLeave} short leaves.`,
      attendanceStatus,
    };

  // Shift grace time
  const shiftGraceTime = attendance.shift?.shiftGrace || 0;

  const totalMinutes =
    shiftGraceTime +
    +attendance.roundOffMinutes +
    +shortLeavePolicy.minutesForShortLeave;

  // new fulldayhalf day

  const fulldayhalfday = await executeQuery(
    'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
      attendance.Shift +
      ',' +
      "'" +
      day +
      "'" +
      ',' +
      totalMinutes +
      ')'
  );

  // Check if adding short leave minutes does not change the attendance status
  if (+attendance.fulldayhalfday == +fulldayhalfday[0].fulldayhalfday) {
    return {
      message: `Applying '${shortLeavePolicy.minutesForShortLeave}' minutes of short leave will not change your attendance status. Hence, short leave cannot be approved.`,
      attendanceStatus,
    };
  } else {
    return { message, attendanceStatus: +fulldayhalfday[0].fulldayhalfday };
  }
}

exports.listShortLeaveAuthRequest = async (req, res, next) => {
  try {
    const { limit, page, startdate, enddate, userMasterID, user, status } =
      req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      status: 1,
      userMasterID,
    };

    if ((!user || user.length === 0) && status) {
      condition.authstatus = status;
      if (status == 2)
        condition['$userShortLeave.authorizationStatus$'] = {
          [Sequelize.Op.notIn]: [3, 4, 5],
        };
    }

    if (user && user.length > 0) {
      condition['$userShortLeave.userMasterID$'] = {
        [Sequelize.Op.in]: user,
      };
    }

    if (startdate && enddate) {
      condition['$userShortLeave.date$'] = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const { rows: authRequest, count } =
      await ShortLeaveAuthorization.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginateCondition,
        order: [['createdAt', 'DESC']],
        include: [
          {
            required: true,
            model: UserShortLeave,
            include: [
              {
                model: UserMaster,
                attributes: [
                  'displayName',
                  'userNumber',
                  'userMasterID',
                  'photo',
                ],
                include: [
                  {
                    separate: true,
                    model: EmployeeJoiningDetails,
                    attributes: ['employeeCode'],
                  },
                  {
                    required: false,
                    separate: true,
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
                    required: false,
                    separate: true,

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
                  {
                    separate: true,
                    model: AuthorizationDetails,
                    where: {
                      status: 1,
                      AuthorizationMasterID: authorizationMasterTypes.leave, // fot Leave
                    },
                    attributes: ['AuthorizationCriteriaID'],
                    include: [
                      {
                        model: AuthorizationCriteriaMaster,
                        attributes: ['AuthorizationCriteria'],
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
      data: authRequest,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuthorizationRequestByReferenceId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const authData = await ShortLeaveAuthorization.findAll({
      where: {
        referenceId: id,
      },
      include: [
        {
          model: UserMaster,
          attributes: ['displayName'],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: authData,
    });
  } catch (error) {
    next(error);
  }
};

exports.shortLeaveAcceptReject = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, authstatus, remarks } = req.body;

    let notification = false;

    const authData = await ShortLeaveAuthorization.findByPk(id, {
      include: [{ model: UserShortLeave }],
      transaction,
    });

    if (!authData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 200,
        message: 'ShortLeave authorization request not found.',
      });
    }

    const shortLeave = authData.userShortLeave || null;

    if (!shortLeave) throw new Error('shortLeave not found.');

    const userMasterID = shortLeave.userMasterID;
    const date = shortLeave.date;
    const referenceId = authData.referenceId;
    const AttendanceTransID = shortLeave.AttendanceTransID;

    // user Details
    const userDetails = await UserMaster.findOne({
      where: {
        userMasterID,
      },
      include: [
        {
          required: false,
          model: EmployeeShortLeavePolicy,
          where: {
            applicableDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(date) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['shortLeavePolicyID'],
          include: [{ model: ShortLeave }],
        },
        {
          model: EmployeeSalaryPolicy,
          required: false,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(date) },
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
          separate: true,
          required: false,
          model: HrLeaveMonthlyTrans,
          where: {
            monthstartdate: {
              [Sequelize.Op.lte]: date,
            },
            monthenddate: { [Sequelize.Op.gte]: date },
            verified: 1,
          },
          limit: 1,
        },
        {
          required: false,
          model: attendanceTransaction,
          where: {
            AttendanceTransID,
          },
          include: [
            {
              model: Shift,
              attributes: ['shiftID', 'shiftGrace'],
            },
          ],
        },
        {
          required: false,
          model: weekoffHolidayTran,
          where: {
            date,
            optionalHoliday: false,
          },
        },
      ],
      attributes: ['userMasterID', 'displayName'],
      transaction,
    });

    if (!userDetails) throw new Error('User not found!');

    let attendanceStatus = null;

    if (authstatus == 1) {
      // check validation
      const validation = await checkShortLeaveAcceptValidation(
        userDetails,
        date,
        referenceId
      );

      if (validation.message) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: validation.message,
        });
      }
      // set attendance status
      attendanceStatus = validation.attendanceStatus;
    }

    const allAuthData = await ShortLeaveAuthorization.findAll({
      where: { referenceId },
      transaction,
      include: [{ model: UserShortLeave }],
    });

    const authorizationDetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.leave, // Leave Id
        userMasterID: userMasterID,
        status: 1,
      },
      transaction,
    });

    if (!authorizationDetails) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 401, message: 'Authorization details not found' });
    }

    const authorizationCriteria = await AuthorizationCriteriaMaster.findOne({
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
        .json({ status: 401, message: 'Authorization criteria not found' });
    }

    const allAuthIds = allAuthData.map((e) => e.id);

    if (authstatus == 0) {
      notification = true;
      await UserInbox.destroy({
        where: {
          activityTable: ShortLeaveAuthorization.getTableName(),
          activityTablePK: allAuthIds,
        },
        transaction,
      });

      await UserShortLeave.update(
        { authorizationStatus: 4 },
        {
          where: { userShortLeaveId: referenceId },
          user: req.userDetails,
          transaction,
        }
      );
    } else {
      const notification1 = {
        title: 'Short Leave',
        body: userDetails.displayName + ' requested for Short Leave.',
      };
      const data = {
        screen: 'shortLeaveAuth',
      };

      if (authorizationCriteria.AuthorizationCriteria === 'Sequeance No') {
        await UserInbox.destroy({
          where: {
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: allAuthIds,
          },
          transaction,
        });

        const authRequests = allAuthData.filter((e) => e.authstatus != 0);

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
          const shortLeaveAuth = await ShortLeaveAuthorization.create(
            {
              referenceId,
              userMasterID: remainingUserIds[0],
              status: 1,
              authstatus: 2,
            },
            { user: req.userDetails, transaction }
          );

          await UserInbox.create(
            {
              activityTable: ShortLeaveAuthorization.getTableName(),
              activityTablePK: shortLeaveAuth.toJSON().id,
              message: `${
                userDetails.displayName
              } has requested for Short Leave for ${moment(date).format(
                'DD/MM/YYYY'
              )}`,
              assignedTo: remainingUserIds[0],
              assignedBy: userDetails.userMasterID,
            },
            { transaction }
          );

          sendNotification(remainingUserIds[0], notification1, data);
        } else {
          notification = true;

          await UserShortLeave.update(
            {
              authorizationStatus: 3,
            },
            {
              where: { userShortLeaveId: referenceId },
              user: req.userDetails,
              transaction,
            }
          );
        }
      } else if (authorizationCriteria.AuthorizationCriteria === 'Any One') {
        await UserInbox.destroy({
          where: {
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: id,
          },
          transaction,
        });

        const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);

        if (approvedRequests.length + 1 >= 1) {
          await UserInbox.destroy({
            where: {
              activityTable: ShortLeaveAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
            transaction,
          });
          notification = true;

          await UserShortLeave.update(
            {
              authorizationStatus: 3,
            },
            {
              where: { userShortLeaveId: referenceId },
              user: req.userDetails,
              transaction,
            }
          );
        }
      } else if (authorizationCriteria.AuthorizationCriteria === 'Any Two') {
        await UserInbox.destroy({
          where: {
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: id,
          },
          transaction,
        });

        const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);
        if (approvedRequests.length + 1 >= 2) {
          await UserInbox.destroy({
            where: {
              activityTable: ShortLeaveAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
            transaction,
          });

          notification = true;

          await UserShortLeave.update(
            {
              authorizationStatus: 3,
            },
            {
              where: { userShortLeaveId: referenceId },
              user: req.userDetails,
              transaction,
            }
          );
        }
      } else {
        await UserInbox.destroy({
          where: {
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: id,
          },
          transaction,
        });

        const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);

        if (approvedRequests.length + 1 >= 3) {
          await UserInbox.destroy({
            where: {
              activityTable: ShortLeaveAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
            transaction,
          });

          notification = true;
          await UserShortLeave.update(
            {
              authorizationStatus: 3,
            },
            {
              where: { userShortLeaveId: referenceId },
              user: req.userDetails,
              transaction,
            }
          );
        }
      }
    }

    await ShortLeaveAuthorization.update(
      {
        viewstatus: 0,
        authstatus: authstatus,
        remarks,
      },
      {
        where: { id },
        user: req.userDetails,
        transaction,
      }
    );

    const data = {
      screen: 'shortLeaveAuth',
    };

    if (authstatus == 1) {
      if (notification) {
        // update attendance status
        await attendanceTransaction.update(
          {
            fulldayhalfday: attendanceStatus,
            updateBy: req.userDetails.userMasterId,
          },
          { where: { AttendanceTransID }, transaction }
        );

        const notification1 = {
          title: 'Short Leave',
          body: 'Short Leave accepted successfully',
        };

        sendNotification(userMasterID, notification1, data);
      }
    } else {
      const notification1 = {
        title: 'Short Leave',
        body: 'Short Leave rejected successfully',
      };

      sendNotification(userMasterID, notification1, data);
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        authstatus === 1
          ? 'Short Leave Request Accept Successfully.'
          : 'Short Leave Request Reject Successfully.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
