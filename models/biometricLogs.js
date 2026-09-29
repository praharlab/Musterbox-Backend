const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'biometricLogs';

const BiometricLogs = sequelize.define(table_name, {
  biometricLogsID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  EmployeeCode: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Serialnumber: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  logDateTime: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  Image64: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
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
});

module.exports = BiometricLogs;
