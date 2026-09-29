const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const AttendanceCorrectionRequest = require('./attendanceCorrectionRequest');
const Shift = require('./shift');

const AttendanceCorrectionLogs = sequelize.define(
  'attendanceCorrectionLogs',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    logDateTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    direction: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    attendanceStatus: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    isChangeLog: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    shiftID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    logId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    createBy: {
      type: Sequelize.INTEGER,
    },
    updateBy: {
      type: Sequelize.INTEGER,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  { paranoid: true }
);

AttendanceCorrectionLogs.addHook(
  'beforeCreate',
  (attendanceCorrectionLogs, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    attendanceCorrectionLogs.createBy = options.user.userMasterId;
    attendanceCorrectionLogs.updateBy = options.user.userMasterId;
    attendanceCorrectionLogs.createByIp = options.user.userIpAddress;
    attendanceCorrectionLogs.updateByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionLogs.addHook(
  'beforeUpdate',
  (attendanceCorrectionLogs, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    attendanceCorrectionLogs.updateBy = options.user.userMasterId;
    attendanceCorrectionLogs.ipAddress = options.user.userIpAddress;
    attendanceCorrectionLogs.updateByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionLogs.addHook(
  'beforeDestroy',
  (attendanceCorrectionLogs, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    attendanceCorrectionLogs.deleteBy = options.user.userMasterId;
    attendanceCorrectionLogs.deleteByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionLogs.belongsTo(AttendanceCorrectionRequest, {
  foreignKey: { name: 'attendanceCorrectionRequestId' },
});

AttendanceCorrectionRequest.hasMany(AttendanceCorrectionLogs, {
  foreignKey: { name: 'attendanceCorrectionRequestId' },
});

AttendanceCorrectionLogs.belongsTo(Shift, {
  foreignKey: { name: 'shiftID' },
});

module.exports = AttendanceCorrectionLogs;
