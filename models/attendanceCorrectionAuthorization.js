const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Shift = require('./shift');
const AttendanceCorrectionRequest = require('./attendanceCorrectionRequest');
const UserMaster = require('./userMaster');

const AttendanceCorrectionAuthorization = sequelize.define(
  'attendanceCorrectionAuthorization',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    authStatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    status: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },

    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
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

AttendanceCorrectionAuthorization.addHook(
  'beforeCreate',
  (attendanceCorrectionAuthorization, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    attendanceCorrectionAuthorization.createBy = options.user.userMasterId;
    attendanceCorrectionAuthorization.updateBy = options.user.userMasterId;
    attendanceCorrectionAuthorization.createByIp = options.user.userIpAddress;
    attendanceCorrectionAuthorization.updateByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionAuthorization.addHook(
  'beforeUpdate',
  (attendanceCorrectionAuthorization, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    attendanceCorrectionAuthorization.updateBy = options.user.userMasterId;
    attendanceCorrectionAuthorization.ipAddress = options.user.userIpAddress;
    attendanceCorrectionAuthorization.updateByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionAuthorization.addHook(
  'beforeDestroy',
  (attendanceCorrectionAuthorization, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    attendanceCorrectionAuthorization.deleteBy = options.user.userMasterId;
    attendanceCorrectionAuthorization.deleteByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionAuthorization.belongsTo(UserMaster, {
  as: 'authorizedPerson',
  foreignKey: { name: 'userMasterID' },
});

AttendanceCorrectionAuthorization.belongsTo(UserMaster, {
  as: 'createdByuser',
  foreignKey: { name: 'createBy' },
});

AttendanceCorrectionAuthorization.belongsTo(UserMaster, {
  as: 'updatedByUser',
  foreignKey: { name: 'updateBy' },
});

AttendanceCorrectionAuthorization.belongsTo(UserMaster, {
  as: 'deletedByUser',
  foreignKey: { name: 'deleteBy' },
});

AttendanceCorrectionAuthorization.belongsTo(AttendanceCorrectionRequest, {
  foreignKey: { name: 'attendanceCorrectionRequestId' },
});

AttendanceCorrectionRequest.hasMany(AttendanceCorrectionAuthorization, {
  foreignKey: { name: 'attendanceCorrectionRequestId' },
});

module.exports = AttendanceCorrectionAuthorization;
