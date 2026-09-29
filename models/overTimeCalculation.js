const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const attendanceTransaction = require('./attendanceTransaction');
const companyMaster = require('./companyMaster');
const attendancePolicy = require('./attendancePolicy');

const tableName = 'OverTimeCalculation';
const overTimeCalculation = sequelize.define(tableName, {
  OverTimeID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  // foreign key
  CompanyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  // foreign key
  AttendancePolicyID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  // foreign key
  AttendanceTransID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  // foreign key
  UserMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },

  OverTimeDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  OverTimeIn: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  OverTimeOut: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  OverTimeHourAndMin: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  UpdateTimeIn: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  UpdateTimeOut: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  UpdateOverTimeHourAndMin: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  AuthorizationRequired: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  OverTimeInDateTime: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  OverTimeOutDateTime: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  UpdateTimeInDateTime: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  UpdateTimeOutDateTime: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  autoApprove: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
});
overTimeCalculation.belongsTo(companyMaster, {
  foreignKey: { name: 'CompanyMasterID' },
});
overTimeCalculation.belongsTo(attendancePolicy, {
  foreignKey: { name: 'AttendancePolicyID' },
});
overTimeCalculation.belongsTo(attendanceTransaction, {
  foreignKey: { name: 'AttendanceTransID' },
});
overTimeCalculation.belongsTo(UserMaster, {
  foreignKey: { name: 'UserMasterID' },
});
attendanceTransaction.hasMany(overTimeCalculation, {
  foreignKey: { name: 'AttendanceTransID' },
});
module.exports = overTimeCalculation;
