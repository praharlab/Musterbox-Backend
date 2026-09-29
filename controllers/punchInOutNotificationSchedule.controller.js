const { Op, literal } = require('sequelize');
const cron = require('node-cron');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const UserMaster = require('../models/userMaster');
const NotificationCrons = require('../models/notificationCrons');
const Shift = require('../models/shift');
const ShiftTime = require('../models/shiftTime');
const {
  convert12H24HTime,
  generateCronExpression,
  modifyTime,
  sendBulkNotification,
} = require('../utils/commonUtilFunctions');
const EmployeeShift = require('../models/employeeShift');
const CompanyNotificationSetup = require('../models/companyNotificationSetup');
const { notificationCronTypes } = require('../utils/dbUtils');
const companyMaster = require('../models/companyMaster');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const UserLeaveTransaction = require('../models/userLeaveTransaction');
const UserLeave = require('../models/userleave');
const attendanceTransaction = require('../models/attendanceTransaction');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, '../', 'cron.log'),
  {
    flags: 'a',
  }
);

const shiftInOutNotificationCron = async (companyCronSetup, type) => {
  const companyMasterIds = companyCronSetup.map((e) => e.companyMasterId);
  // if (companyMasterIds.length > 1 && !companyMasterIds.include(3)) {
  //   throw new Error('company test failed');
  // }
  let dbVar;
  let payload;
  // Find users who have holiday or weekoff today
  let usersThatHaveHolidayWo = await weekoffHolidayTran.findAll({
    where: {
      date: moment().format('YYYY-MM-DD'),
      optionalHoliday: false,
    },
    include: [
      {
        model: UserMaster,
        where: { companyMasterId: companyMasterIds },
        attributes: [],
      },
    ],
    attributes: ['userMasterID'],
  });

  if (usersThatHaveHolidayWo.length)
    usersThatHaveHolidayWo = usersThatHaveHolidayWo.map(
      (e) => e.toJSON().userMasterID
    );

  // Find users who are on leave today
  let usersOnLeave = await UserLeaveTransaction.findAll({
    where: { status: 1, date: moment().format('YYYY-MM-DD') },
    include: [
      {
        model: UserLeave,
        where: { companyMasterID: companyMasterIds, authorizationStatus: 3 },
        attributes: ['userMasterID'],
      },
    ],
  });

  if (usersOnLeave.length)
    usersOnLeave = usersOnLeave.map((e) => e.toJSON().userLeave.userMasterID);
  if (type === notificationCronTypes.PUNCH_IN) {
    dbVar = 'statTime';
    payload = {
      notification: {
        title: 'Punch in reminder',
        body: `Hello! It's time to start your shift. Please remember to punch in for work. Have a productive day ahead! 🌞`,
        // icon: ""
      },
    };
  }
  if (type === notificationCronTypes.PUNCH_OUT) {
    dbVar = 'endtime';
    payload = {
      notification: {
        title: 'Punch out reminder',
        body: `Hello! Your shift is ending. Don't forget to punch out to record your end time. Thank you for your hard work today! 🌟`,
        // icon: ""
      },
    };
  }

  // Find shift of employees
  let employeeShift = await EmployeeShift.findAll({
    where: {
      userMasterID: {
        [Op.notIn]: [...usersThatHaveHolidayWo, ...usersOnLeave],
      },
      startDate: { [Op.lte]: literal('CURRENT_DATE') },
      [Op.or]: [
        { endDate: { [Op.eq]: null } },
        { endDate: { [Op.gte]: literal('CURRENT_DATE') } },
      ],
    },
    attributes: ['userMasterID', 'shiftID', 'shiftsID'],
    include: [
      {
        model: UserMaster,
        as: 'employee',
        where: { status: 1, companyMasterId: companyMasterIds },
        attributes: [],
      },
    ],
  });
  if (!employeeShift.length) {
    throw new Error('No employee shift found!');
  }
  employeeShift = employeeShift.map((e) => {
    const obj = e.toJSON();
    if (!obj.shiftID && obj.shiftsID.length === 1)
      obj.shiftID = obj.shiftsID[0];
    return obj;
  });
  employeeShift = employeeShift.filter((e) => e.shiftID !== null);
  const today = new Date(); // Get the current date
  const day = today.toLocaleDateString('en-US', { weekday: 'long' }); // Get the current day name

  // Find time of each shift
  let shiftTimeDetails = await ShiftTime.findAll({
    where: { day },
    attributes: ['shiftTimeID', 'day', dbVar, 'shiftID'],
    include: [
      {
        model: Shift,
        where: { status: 1, companyMasterID: companyMasterIds },
        attributes: ['companyMasterID'],
      },
    ],
  });
  if (!shiftTimeDetails.length) {
    throw new Error('No shift time found!');
  }
  shiftTimeDetails = shiftTimeDetails.map((e) => {
    const obj = e.toJSON();
    const companyCronSetting = companyCronSetup.filter(
      (e) => +e.companyMasterId === +obj.shift.companyMasterID
    );
    obj[dbVar] = modifyTime(
      obj[dbVar],
      companyCronSetting[0].time,
      companyCronSetting[0].timeType,
      companyCronSetting[0].timeFormat
    );
    return obj;
  });

  const timeData = _.groupBy(shiftTimeDetails, dbVar);
  const groupedEmployeeShift = _.groupBy(employeeShift, 'shiftID');
  const notificationData = [];
  Object.keys(timeData).forEach((timeKeys) => {
    const obj = {
      time: convert12H24HTime(timeKeys),
      date: moment().format('YYYY-MM-DD'),
      type,
      users: [],
    };
    obj.cronExpression = generateCronExpression(obj.time);
    timeData[timeKeys].forEach((data) => {
      if (
        groupedEmployeeShift[data.shiftID] &&
        groupedEmployeeShift[data.shiftID].length
      ) {
        obj.users.push(
          ...groupedEmployeeShift[data.shiftID].map((e) => e.userMasterID)
        );
      }
    });
    if (obj.users.length) {
      notificationData.push(obj);
    }
  });
  await NotificationCrons.bulkCreate(notificationData);

  notificationData.forEach((e, index) => {
    cron.schedule(
      e.cronExpression,
      async (cronRunTime) => {
        accessLogStream.write(
          `${new Date().toLocaleString()} ===> Running cron for punch-in/punch-out \n`
        );
        const notificationCronData = await NotificationCrons.findOne({
          where: {
            date: moment().format('YYYY-MM-DD'),
            time: moment(cronRunTime).format('HH:mm:00'),
            type,
          },
        });
        if (!notificationCronData) {
          accessLogStream.write(
            `${new Date().toLocaleString()} ===> No cron found to be run at:  ${cronRunTime}\n`
          );
          return;
        }
        // Logic to send out notification to those who have punched in in last 20 hours and not punched out
        try {
          let presentUsers = [];
          if (
            notificationCronData.toJSON().type ===
            notificationCronTypes.PUNCH_OUT
          ) {
            // condition to find users who have not punched-in in last 20 hours do
            const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);
            presentUsers = await attendanceTransaction.findAll({
              where: {
                userMasterID: notificationCronData.toJSON().users,
                InDatetime: {
                  [Op.gt]: twentyHoursAgo, // Find entries created before twentyHoursAgo
                },
              },
              raw: true,
              order: [['InDatetime', 'DESC']],
              attributes: ['userMasterID', 'OutDateTime'],
            });
            if (!presentUsers) {
              accessLogStream.write(
                `${new Date().toLocaleString()} ===> No present users found for cront at:  ${cronRunTime}\n`
              );
              return;
            }
            presentUsers = presentUsers
              .filter((e) => e.OutDateTime == null || e.OutDateTime == '')
              .map((ele) => ele.userMasterID);
            console.log({ presentUsers });
          } else if (
            notificationCronData.toJSON().type ===
            notificationCronTypes.PUNCH_IN
          ) {
            presentUsers = notificationCronData.toJSON().users;
          }
          const userData = await UserMaster.findAll({
            where: {
              userMasterID: [...presentUsers],
              firebaseToken: { [Op.ne]: null, [Op.ne]: '' },
              status: 1,
            },
            attributes: ['firebaseToken', 'deviceType'],
          });
          const iosTokens = [];
          const androidTokens = [];
          userData.forEach((user) => {
            // eslint-disable-next-line no-unused-expressions
            user.toJSON().deviceType === 'ios' && user.firebaseToken
              ? iosTokens.push(user.firebaseToken)
              : androidTokens.push(user.firebaseToken);
          });
          await sendBulkNotification(iosTokens, payload, 'ios');
          await sendBulkNotification(androidTokens, payload, 'android');
          notificationCronData.status = 'COMPLETED';
          await notificationCronData.save();
          accessLogStream.write(
            `${new Date().toLocaleString()} ===> Successfully ran cron\n`
          );
        } catch (error) {
          accessLogStream.write(
            `${new Date().toLocaleString()} ===> Ran into an error while running ${
              notificationCronData.toJSON().type
            } cron at ${cronRunTime}\n`
          );
          notificationCronData.status = 'ERROR';
          await notificationCronData.save();
        }
      },
      { name: `notification-${type}-${index}` }
    );
  });
  accessLogStream.write(
    `${new Date().toLocaleString()} ===> cron scheduled to run crons for ${type} notification\n`
  );

};

const holidayNotificationCron = async (companyCronSetup, type) => {
  const companyMasterIds = companyCronSetup.map((e) => e.companyMasterId);
  const payload = {
    notification: {
      title: 'Holiday reminder',
      body: `Hello! You have a holiday tomorrow!`,
    },
  };
  const tomorrowDate = moment().add(1, 'day').format('YYYY-MM-DD');
  let employeeHolidays = await weekoffHolidayTran.findAll({
    where: {
      date: tomorrowDate,
      // companyMasterID: companyMasterIds,
      optionalHoliday: false,
    },
    include: [
      // { model: companyMaster, where: { status: 1 }, attributes: [] },
      {
        model: UserMaster,
        where: {
          firebaseToken: { [Op.ne]: null, [Op.ne]: '' },
          companyMasterId: companyMasterIds,
          status: 1,
        },
        attributes: [],
        include: [
          { model: companyMaster, attributes: [], where: { status: 1 } },
        ],
      },
    ],
  });
  if (!employeeHolidays.length) {
    throw new Error('No employee holidays found!');
  }
  const notificationData = {
    type,
    time: '11:00:00',
    date: moment().format('YYYY-MM-DD'),
    users: [],
    cronExpression: generateCronExpression('11:00:00'),
  };
  employeeHolidays = employeeHolidays.map((e) => {
    const obj = e.toJSON();
    notificationData.users.push(obj.userMasterID);
    return obj;
  });

  await NotificationCrons.create(notificationData);

  cron.schedule(
    notificationData.cronExpression,
    async (cronRunTime) => {
      const notificationCronData = await NotificationCrons.findOne({
        where: {
          date: moment().format('YYYY-MM-DD'),
          time: moment(cronRunTime).format('HH:mm'),
          type: notificationCronTypes.HOLIDAY,
        },
      });
      if (!notificationCronData) {
        accessLogStream.write(
          `${new Date().toLocaleString()} ===> No holiday cron found to be run at:  ${cronRunTime}\n`
        );
        return;
      }
      try {
        const userData = await UserMaster.findAll({
          where: { userMasterID: notificationCronData.toJSON().users },
          attributes: ['firebaseToken', 'deviceType'],
          status: 1,
        });
        const iosTokens = [];
        const androidTokens = [];
        userData.forEach((user) => {
          // eslint-disable-next-line no-unused-expressions
          user.toJSON().deviceType === 'ios'
            ? iosTokens.push(user.firebaseToken)
            : androidTokens.push(user.firebaseToken);
        });
        await sendBulkNotification(iosTokens, payload, 'ios');
        await sendBulkNotification(androidTokens, payload, 'android');
        notificationCronData.status = 'COMPLETED';
        await notificationCronData.save();
      } catch (error) {
        accessLogStream.write(
          `${new Date().toLocaleString()} ===> Ran into an error while running ${type} cron at ${cronRunTime}\n`
        );
        notificationCronData.status = 'ERROR';
        await notificationCronData.save();
      }
    },
    { name: `notification-punch-${type}-0` }
  );
  accessLogStream.write(
    `${new Date().toLocaleString()} ===> cron scheduled to run crons for ${type} notification\n`
  );
};

exports.scheduleNotifications = async () => {
  try {
    await NotificationCrons.destroy({ where: {} });
    cron.getTasks().forEach((e) => {
      if (e.options.name.includes(`notification-`)) {
        accessLogStream.write(
          `${new Date().toLocaleString()} ===> Found already scheduled job for and stopping it: ${
            e.options.name
          }\n`
        );
        e.stop();
      }
    });
    let companyNotifications = await CompanyNotificationSetup.findAll({
      where: {
        [Op.or]: [
          { notificationType: notificationCronTypes.PUNCH_IN },
          { notificationType: notificationCronTypes.PUNCH_OUT },
          { notificationType: notificationCronTypes.HOLIDAY },
        ],
      },
      include: [{ model: companyMaster, where: { status: 1 } }],
    });
    if (!companyNotifications.length) {
      throw new Error('No notification setup found!');
    }
    companyNotifications = companyNotifications.map((e) => e.toJSON());
    const dataByNotificationType = _.groupBy(
      companyNotifications,
      'notificationType'
    );
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(dataByNotificationType)) {
      switch (key) {
        case notificationCronTypes.PUNCH_IN:
          // eslint-disable-next-line no-await-in-loop
          await shiftInOutNotificationCron(
            dataByNotificationType[notificationCronTypes.PUNCH_IN],
            notificationCronTypes.PUNCH_IN
          );
          break;

        case notificationCronTypes.PUNCH_OUT:
          // eslint-disable-next-line no-await-in-loop
          await shiftInOutNotificationCron(
            dataByNotificationType[notificationCronTypes.PUNCH_OUT],
            notificationCronTypes.PUNCH_OUT
          );
          break;

        case notificationCronTypes.HOLIDAY:
          // eslint-disable-next-line no-await-in-loop
          await holidayNotificationCron(
            dataByNotificationType[notificationCronTypes.HOLIDAY],
            notificationCronTypes.HOLIDAY
          );
          break;

        default:
          break;
      }
    }
  } catch (error) {
    accessLogStream.write(
      `${new Date().toLocaleString()} ===> 'Something went wrong while running cron of setting up notifications!',\n,${error}\n`
    );
  }
};

if(process.env.NODE_ENV === 'production'){
  cron.schedule(
    '0 0 * * *',
    async () => {
      await this.scheduleNotifications();
    },
    { name: 'midnight-notificationcron' }
  );
}

exports.setupPunchInPunchoutCron = async (req, res, next) => {
  await this.scheduleNotifications();
};
