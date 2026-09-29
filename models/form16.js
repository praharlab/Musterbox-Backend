const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'form16';

const Form16 = sequelize.define(table_name, {
  Form16ID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  SalaryDetails: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Series: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  ParentForm16ID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    defaultValue: 0,
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
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

module.exports = Form16;
