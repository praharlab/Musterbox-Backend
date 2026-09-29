const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const AttendanceLogs = require('../models/attendancelogs');
const UserTracking = require('../models/userTracking');
const { sendNotification } = require('../utils/commonUtilFunctions');

const changeOnlineStatus = async (userId, isOnline) => {
  try {
    const trackingpermission = await UserTracking.findOne({
      where: {
        userMasterID: userId,
        trackStatus: 1,
        statusMonitoring: 1,
      },
    });

    if (
      trackingpermission?.statusMonitoring &&
      trackingpermission?.statusMonitoring == 1
    ) {
      const [affectedRows] = await UserMaster.update(
        { isOnline },
        { where: { userMasterID: userId } }
      );

      console.log("User's statusMonitoring is ON and status changed.");
      return true;
    } else {
      console.log("User's statusMonitoring not ON");
      return false;
    }
  } catch (error) {
    console.log(`Error updating online status for user ${userId}:`, error);
    return false;
  }
};

const sendNotificationToInactiveUser = async (userId) => {
  try {
    let attendanceLog = await AttendanceLogs.findOne({
      where: {
        userMasterID: userId,
      },
      order: [['createdAt', 'DESC']],
      raw: true,
    });
    if (attendanceLog?.direction && attendanceLog.direction == 'in') {
      // Send Notification to main User -- Code Start
      console.log('Sending Notification to this User ', userId);
      const notification = {
        title: "You're Back on Track!",
        body: "Everything's running smoothly!",
      };
      const data = {
        screen: 'home',
      };
      await sendNotification(userId, notification, data);
      // Send Notification to main User -- Code End
    }
  } catch (error) {
    console.log(`Error sending notification for user ${userId}:`, error);
  }
};

module.exports = {
  sendNotificationToInactiveUser,
  changeOnlineStatus,
};
