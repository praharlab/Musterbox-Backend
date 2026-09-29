const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'attendanceCorrectionReason';
const UserMaster = require('./userMaster');
const companyMaster = require('./companyMaster');

const AttendanceCorrectionReason = sequelize.define(
  table_name,
  {
    attendanceCorrectionReasonID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    reason: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isDefault: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
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
  {
    paranoid: true,
  }
);

AttendanceCorrectionReason.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

AttendanceCorrectionReason.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

AttendanceCorrectionReason.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

AttendanceCorrectionReason.belongsTo(UserMaster, {
  as: 'deletedByUserDetails',
  foreignKey: { name: 'deleteBy' },
});

AttendanceCorrectionReason.addHook(
  'beforeCreate',
  (attendanceCorrectionReason, options) => {
    attendanceCorrectionReason.createBy = options.user.userMasterId;
    attendanceCorrectionReason.createByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionReason.addHook(
  'beforeUpdate',
  (attendanceCorrectionReason, options) => {
    attendanceCorrectionReason.updateBy = options.user.userMasterId;
    attendanceCorrectionReason.updateByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionReason.addHook(
  'beforeDestroy',
  (attendanceCorrectionReason, options) => {
    attendanceCorrectionReason.deleteBy = options.user.userMasterId;
    attendanceCorrectionReason.deleteByIp = options.user.userIpAddress;
  }
);
module.exports = AttendanceCorrectionReason;
