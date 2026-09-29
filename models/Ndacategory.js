const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const CompanyMaster = require('./companyMaster');
const table_name = 'Ndacategory';
const ndacategory = sequelize.define(table_name, {
  Ndacategoryid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  nda_category: {
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
});

ndacategory.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = ndacategory;
