const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const AttendanceBonusPolicy = require('./attendanceBonusPolicy');
const UserMaster = require('./userMaster');
const table_name = 'employeeAttendanceBonusPolicy';
const EmployeeAttendanceBonusPolicy = sequelize.define(
  table_name,
  {
    employeeAttendanceBonusID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    attendanceBonusPolicyId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    startDate: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  {
    paranoid: true,
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['startDate'],
      },
      {
        unique: false,
        fields: ['attendanceBonusPolicyId'],
      },
    ],
  }
);

EmployeeAttendanceBonusPolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeAttendanceBonusPolicy.belongsTo(AttendanceBonusPolicy, {
  foreignKey: { name: 'attendanceBonusPolicyId' },
});
UserMaster.hasMany(EmployeeAttendanceBonusPolicy, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeAttendanceBonusPolicy.addHook(
  'beforeCreate',
  (employeeAttendanceBonusPolicy, options) => {
    console.log(options, 'options');
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    employeeAttendanceBonusPolicy.createBy = options.user.userMasterId;
    employeeAttendanceBonusPolicy.updateBy = options.user.userMasterId;
    employeeAttendanceBonusPolicy.createByIp = options.user.userIpAddress;
    employeeAttendanceBonusPolicy.updateByIp = options.user.userIpAddress;
  }
);

EmployeeAttendanceBonusPolicy.addHook(
  'beforeUpdate',
  (employeeAttendanceBonusPolicy, options) => {
    employeeAttendanceBonusPolicy.updateBy = options.user.userMasterId;
    employeeAttendanceBonusPolicy.ipAddress = options.user.userIpAddress;
    employeeAttendanceBonusPolicy.updateByIp = options.user.userIpAddress;
  }
);

EmployeeAttendanceBonusPolicy.addHook(
  'beforeDestroy',
  (employeeAttendanceBonusPolicy, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    employeeAttendanceBonusPolicy.deleteBy = options.user.userMasterId;
    employeeAttendanceBonusPolicy.deleteByIp = options.user.userIpAddress;
  }
);

EmployeeAttendanceBonusPolicy.belongsTo(UserMaster,{
  as: 'createdByUserDetails',
  foreignKey: {name: 'createBy'}
});

EmployeeAttendanceBonusPolicy.belongsTo(UserMaster,{
  as: 'updatedByUserDetails',
  foreignKey: {name: 'updateBy'}
});

EmployeeAttendanceBonusPolicy.belongsTo(UserMaster,{
  as: 'deletedByUserDetails',
  foreignKey: {name: 'deleteBy'}
});

module.exports = EmployeeAttendanceBonusPolicy;
