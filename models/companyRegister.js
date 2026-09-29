const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'companyRegister';
const companyRegister = sequelize.define(table_name, {
  companyRegisterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  companyMasterId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  PFNo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  ESINo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  GSTNo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  LWFNo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  TANNo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  PANNo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status: {
    type: Sequelize.BIGINT,
    allowNull: false,
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

module.exports = companyRegister;
