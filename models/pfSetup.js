const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'PFSetup';
const PFetup = sequelize.define(table_name, {
  PFSetupID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  PFStatus: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
  basicForPF: {
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
  maximumMonthlyPF: {
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
  hidePFEmployerPayslip: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
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

PFetup.belongsTo(companyMaster, { foreignKey: { name: 'companyMasterID' } });

module.exports = PFetup;
