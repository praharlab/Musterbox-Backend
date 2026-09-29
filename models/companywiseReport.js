const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'companywiseReport';
const companyMaster = require('./companyMaster');

const CompanywiseReport = sequelize.define(table_name, {
  companywiseReportID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  functionName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  displayName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  params: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
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

CompanywiseReport.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
}),
  (module.exports = CompanywiseReport);
