const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const table_name = 'visitors';
const visitors = sequelize.define(table_name, {
  visitorsid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  visitorsFirstName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  visitorsLastName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  visitorsPhone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  visitorsComapny: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
    //forign key
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
  visitorPhoto: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

visitors.belongsTo(CompanyMaster, { foreignKey: { name: 'companyMasterID' } });

module.exports = visitors;
