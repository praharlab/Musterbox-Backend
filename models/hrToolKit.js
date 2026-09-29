const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'hrToolKit';
const hr_ToolKit = sequelize.define(table_name, {
  hrTollKitID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  DocumentName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  DocumentZip: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  No_of_file: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  status: {
    type: Sequelize.BIGINT,
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
});

module.exports = hr_ToolKit;
