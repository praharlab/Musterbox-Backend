const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'hrLeaveMaster';
const HrLeaveMaster = sequelize.define(table_name, {
  LeaveID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  LeaveName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  LeaveDesc: {
    type: Sequelize.STRING,
    allowNull: false,
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
  CF_LeaveID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
});

module.exports = HrLeaveMaster;
