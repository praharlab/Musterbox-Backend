const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserShortLeave = require('../models/userShortLeave');
const FormAuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const UserMaster = require('../models/userMaster');
const ShortLeaveAuthorization = require('../models/shortLeaveAuthorization');
const UserInbox = require('../models/UserInbox');
const {
  sendNotification,
  asiaKolkataDateTime,
  authorization,
  daysInMonth,
} = require('../utils/commonUtilFunctions');
const moment = require('moment');
const UserLeave = require('../models/userleave');
const EmployeeShortLeavePolicy = require('../models/employeeShortLeavePolicy');
const ShortLeave = require('../models/shortLeave');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const attendanceTransaction = require('../models/attendanceTransaction');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const Shift = require('../models/shift');
const ShiftTIme = require('../models/shiftTime');
const { executeQuery } = require('./common.controller');
const { authorizationMasterTypes } = require('../utils/dbUtils');

async function checkShortLeaveApplicationValidation(
  userDetails,
  date,
  type = null,
  id = null
) {
  let message = null;

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
    return (message = 'Short leave can only be applied for past dates.');
  }

  const weekoffHoliday = userDetails.weekoffHolidayTrans[0] || null;

  if (weekoffHoliday)
    return (message = 'Short leave cannot be applied on a Weekoff/Holiday ');

  const attendance = userDetails.attendanceTransactions[0] || null;

  if (!attendance) return (message = `No attendance record found for ${date}.`);

  if (attendance.fulldayhalfday == 1)
    return (message = `You are already marked present on ${date}. Short leave application is not allowed.`);

  if (!attendance.OutDateTime)
    return (message = `Out time is not recorded for ${date}. Short leave application cannot be processed.`);

  const verifiedData = userDetails.hrLeaveMonthlyTrans[0] || null;

  // if verified data found
  if (verifiedData)
    return (message =
      'You cannot apply for short leave as your attendance has already been verified. ');

  const shortLeavePolicy =
    userDetails.employeeShortLeavePolicies?.[0]?.shortLeave || null;

  // Check Short Leave Policy assign or not
  if (!shortLeavePolicy)
    return (message = 'Please assign a short leave policy before applying.');

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
  };

  // if update data
  if (type == 'update')
    shortleaveCondition.userShortLeaveId = {
      [Sequelize.Op.ne]: id,
    };

  const findUsedShortLeaveCount = await UserShortLeave.count({
    where: shortleaveCondition,
  });

  // if used slot leave is greater than to allowed short leave
  if (+findUsedShortLeaveCount >= +shortLeavePolicy.noOfShortLeave)
    return (message = `You have reached your limit of ${shortLeavePolicy.noOfShortLeave} short leaves.`);

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
  if (+attendance.fulldayhalfday === +fulldayhalfday[0].fulldayhalfday)
    return (message = `Applying '${shortLeavePolicy.minutesForShortLeave}' minutes of short leave will not change your attendance status. Hence, short leave cannot be applied.`);

  return;
}

exports.add = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userMasterIDs, date, remarks, type = null } = req.body;

    const [findData, userDetails, Allauthorizationdetails] = await Promise.all([
      UserShortLeave.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterIDs,
          },
          date,
          authorizationStatus: {
            [Sequelize.Op.notIn]: [5, 4],
          },
        },
        transaction,
      }),
      UserMaster.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterIDs,
          },
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
              status: 1,
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
              AttendanceDate: date,
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
      }),
      FormAuthorizationDetails.findAll({
        where: {
          AuthorizationMasterID: authorizationMasterTypes.leave, // Leave
          userMasterID: {
            [Sequelize.Op.in]: userMasterIDs,
          },
          status: 1,
        },
        include: [
          {
            model: AuthorizationCriteriaMaster,
            attributes: ['AuthorizationCriteria'],
          },
        ],

        transaction,
      }),
    ]);

    const alreadyAddData = [];
    const authorizationNotAdd = [];

    const inboxData = [];

    for (const user of userDetails) {
      const userMasterID = user.userMasterID;

      const data = findData.find((e) => e.userMasterID == userMasterID);
      // if data already add
      if (data) {
        alreadyAddData.push(user.displayName);
        continue;
      }
      // check validation
      const message = await checkShortLeaveApplicationValidation(
        user,
        date,
        'add',
        null
      );

      // retrun from here

      if (message) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `${message} `,
        });
      }

      const AttendanceTransID =
        user.attendanceTransactions?.[0]?.AttendanceTransID || null;

      // find Authorization details
      const authorizationdetails = Allauthorizationdetails.find(
        (e) => e.userMasterID == userMasterID
      );

      if (!authorizationdetails) {
        authorizationNotAdd.push(user.displayName);
        continue;
      }

      const authorizationStatus =
        authorizationdetails && authorizationdetails.AuthorizationCriteriaMaster
          ? authorizationdetails.AuthorizationCriteriaMaster
              .AuthorizationCriteria == 'Sequeance No'
            ? 2
            : 1
          : 0;

      // create Short leave

      const addData = await UserShortLeave.create(
        {
          userMasterID,
          date,
          remarks,
          authorizationStatus,
          AttendanceTransID,
        },
        {
          user: req.userDetails,
          transaction,
        }
      );

      // if authorization is set

      if (authorizationStatus != 0) {
        const notification = {
          title: 'Short Leave',
          body: user.displayName + ' requested for a Short Leave.',
        };
        const data = {
          screen: 'shortLeaveAuth',
          isScheduled: 'true',
          scheduledTime: new Date().toISOString(),
        };

        // For Sequence No
        if (authorizationStatus == 2) {
          const authorizationData = await ShortLeaveAuthorization.create(
            {
              referenceId: addData.userShortLeaveId,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
              authstatus: 2,
            },
            { user: req.userDetails, transaction }
          );

          // push in user inbox
          inboxData.push({
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: authorizationData.toJSON().id,
            message: `${
              user.displayName
            } has requested a Short Leave for ${moment(date).format(
              'DD/MM/YYYY'
            )}.`,
            assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
            assignedBy: userMasterID,
          });

          // send Notification
          sendNotification(authorizationData.userMasterID, notification, data);
        } else {
          // For Any
          for (
            let j = 0;
            j < authorizationdetails.AuthorizedByUserMasterId.length;
            j++
          ) {
            const authorizationData = await ShortLeaveAuthorization.create(
              {
                referenceId: addData.userShortLeaveId,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
                authstatus: 2,
              },
              { user: req.userDetails, transaction }
            );

            inboxData.push({
              activityTable: ShortLeaveAuthorization.getTableName(),
              activityTablePK: authorizationData.toJSON().id,
              message: `${
                user.displayName
              } has requested a Short Leave for ${moment(date).format(
                'DD/MM/YYYY'
              )}.`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
              assignedBy: userMasterID,
            });

            // send Notification
            sendNotification(
              authorizationData.userMasterID,
              notification,
              data
            );
          }
        }
      }
    }
    // create all inbox data
    await UserInbox.bulkCreate(inboxData, { transaction });

    let messageParts = [];

    if (alreadyAddData.length > 0) {
      messageParts.push(
        `Users "${alreadyAddData.join(',')}" have already applied for short leave.`
      );
    }

    if (authorizationNotAdd.length > 0) {
      messageParts.push(
        `Users "${authorizationNotAdd.join(',')}" of Authorization details not found.`
      );
    }

    if (alreadyAddData.length || authorizationNotAdd.length) {
      if (!type) {
        const message1 = messageParts.join('<br>');
        await transaction.commit();
        return res.status(200).json({
          status: 401,
          message: message1,
        });
      }
      messageParts.push('And other');
    }

    // Join messages with <br> tags for new lines
    const message = messageParts.join('<br>');

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: `${message}<br>Short Leave Added Successfully`,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.update = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userShortLeaveId = req.params.id;

    const { date, remarks } = req.body;

    const shortLeave = await UserShortLeave.findByPk(userShortLeaveId, {
      transaction,
      include: [
        {
          model: UserMaster,
          attributes: ['userMasterID', 'displayName'],
        },
        {
          required: false,
          model: ShortLeaveAuthorization,
          where: {
            authstatus: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
        },
      ],
    });

    if (!shortLeave) throw new Error('Short Leave Not Found.');

    // if Short leave is Approved

    if (shortLeave.authorizationStatus == 3) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message:
          'You cannot modify a short leave that has already been approved.',
      });
    }

    const authorizationData = shortLeave.shortLeaveAuthorization?.[0] || null;

    // if some one has approve or reject the short leave

    if (authorizationData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message:
          'Your short leave has already been approved or rejected, and cannot be modified.',
      });
    }

    const userMasterID = shortLeave.userMasterID;

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
            AttendanceDate: date,
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

    // check validation
    const message = await checkShortLeaveApplicationValidation(
      userDetails,
      date,
      'update',
      userShortLeaveId
    );

    if (message) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message,
      });
    }

    const AttendanceTransID =
      userDetails.attendanceTransactions?.[0]?.AttendanceTransID || null;

    const authorizationdetails = await FormAuthorizationDetails.findOne(
      {
        where: {
          AuthorizationMasterID: authorizationMasterTypes.leave, // Leave
          userMasterID,
          status: 1,
        },
        include: [
          {
            model: AuthorizationCriteriaMaster,
            attributes: ['AuthorizationCriteria'],
          },
        ],
      },
      { transaction }
    );

    const authorizationStatus =
      authorizationdetails && authorizationdetails.AuthorizationCriteriaMaster
        ? authorizationdetails.AuthorizationCriteriaMaster
            .AuthorizationCriteria == 'Sequeance No'
          ? 2
          : 1
        : 0;

    await UserShortLeave.update(
      {
        date,
        remarks,
        authorizationStatus,
        AttendanceTransID,
      },
      {
        where: {
          userShortLeaveId,
        },
        user: req.userDetails,
        transaction,
      }
    );

    // Delete All

    const authorizationRequest = await ShortLeaveAuthorization.findAll({
      where: {
        referenceId: userShortLeaveId,
      },
      transaction,
    });

    let AuthorizationRequestIds = authorizationRequest.map((form) => form.id);

    // Delete All User Inbox

    await UserInbox.destroy({
      where: {
        activityTable: ShortLeaveAuthorization.getTableName(),
        activityTablePK: AuthorizationRequestIds,
      },
      transaction,
    });

    // Delete All User Short Leave Authorization

    await ShortLeaveAuthorization.destroy({
      where: {
        id: {
          [Sequelize.Op.in]: AuthorizationRequestIds,
        },
      },
      hooks: false,
      transaction,
    });

    if (authorizationStatus != 0) {
      // user Details
      const userDetails = shortLeave.userMaster;

      if (!userDetails) throw new Error('User not found!');

      const notification = {
        title: 'Short Leave',
        body: userDetails.displayName + ' requested for a Short Leave.',
      };
      const data = {
        screen: 'shortLeaveAuth',
        isScheduled: 'true',
        scheduledTime: new Date().toISOString(),
      };

      // For Sequence No
      if (authorizationStatus == 2) {
        const authorizationData = await ShortLeaveAuthorization.create(
          {
            referenceId: userShortLeaveId,
            userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
            authstatus: 2,
          },
          { user: req.userDetails, transaction }
        );

        // Create UserInbox
        await UserInbox.create(
          {
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: authorizationData.toJSON().id,
            message: `${
              userDetails.displayName
            } has requested a Short Leave for ${moment(date).format(
              'DD/MM/YYYY'
            )}.`,
            assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
            assignedBy: userMasterID,
          },
          { transaction }
        );

        // send Notification
        sendNotification(authorizationData.userMasterID, notification, data);
      } else {
        // For Any
        for (
          let j = 0;
          j < authorizationdetails.AuthorizedByUserMasterId.length;
          j++
        ) {
          const authorizationData = await ShortLeaveAuthorization.create(
            {
              referenceId: userShortLeaveId,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
              authstatus: 2,
            },
            { user: req.userDetails, transaction }
          );

          // Create UserInbox
          await UserInbox.create(
            {
              activityTable: ShortLeaveAuthorization.getTableName(),
              activityTablePK: authorizationData.toJSON().id,
              message: `${
                userDetails.displayName
              } has requested a Short Leave for ${moment(date).format(
                'DD/MM/YYYY'
              )}.`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
              assignedBy: userMasterID,
            },
            { transaction }
          );

          // send Notification
          sendNotification(authorizationData.userMasterID, notification, data);
        }
      }
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: 'Short Leave have been successfully updated.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userShortLeaveId = req.params.id;

    const shortLeave = await UserShortLeave.findByPk(userShortLeaveId, {
      transaction,
    });

    if (!shortLeave) throw new Error('Short Leave Not Found.');

    // if Short leave is Approved

    if (shortLeave.authorizationStatus == 3) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message:
          'You cannot delete a short leave that has already been approved.',
      });
    }

    // Delete All

    const authorizationRequest = await ShortLeaveAuthorization.findAll({
      where: {
        referenceId: userShortLeaveId,
      },
      transaction,
    });

    let AuthorizationRequestIds = authorizationRequest.map((form) => form.id);

    // Delete All User Inbox

    await UserInbox.destroy(
      {
        where: {
          activityTable: ShortLeaveAuthorization.getTableName(),
          activityTablePK: AuthorizationRequestIds,
        },
      },
      transaction
    );

    // Delete All User Request

    await ShortLeaveAuthorization.destroy({
      where: {
        id: {
          [Sequelize.Op.in]: AuthorizationRequestIds,
        },
      },
      hooks: false,
      transaction,
    });

    await shortLeave.destroy({
      user: req.userDetails,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: 'Short Leave deleted Successfully.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.listDataByUser = async (req, res, next) => {
  try {
    const { page, limit, userMasterID, startDate, endDate } = req.body;

    if (!userMasterID) {
      return res.status(200).json({
        status: 401,
        message: 'userMasterID is require field.',
      });
    }

    const condition = { userMasterID };

    if (startDate && endDate)
      condition.date = {
        [Sequelize.Op.between]: [startDate, endDate],
      };

    const paginate = page && limit ? { offset: (page - 1) * limit, limit } : {};

    const { rows, count } = await UserShortLeave.findAndCountAll({
      distinct: true,
      where: condition,
      ...paginate,
      include: [
        {
          required: false,
          model: ShortLeaveAuthorization,
          attributes: ['authstatus'],
        },
      ],
      order: [['date', 'DESC']],
    });

    for (let i = 0; i < rows.length; i++) {
      let editDelete = true;
      if ([3, 4, 5].includes(rows[i].authorizationStatus)) editDelete = false;

      if (rows[i].shortLeaveAuthorizations.find((e) => e.authstatus != 2)) {
        editDelete = false;
      }

      rows[i].dataValues.isEditDelete = editDelete;
    }

    const authCritereaData = await FormAuthorizationDetails.findOne({
      where: {
        userMasterID,
        status: 1,
        AuthorizationMasterID: authorizationMasterTypes.leave,
      },
      attributes: ['AuthorizationCriteriaID'],
      include: [
        {
          model: AuthorizationCriteriaMaster,
          attributes: ['AuthorizationCriteria'],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
      authCritereaData:
        authCritereaData?.AuthorizationCriteriaMaster?.AuthorizationCriteria ||
        '',
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await UserShortLeave.findByPk(id);

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};
