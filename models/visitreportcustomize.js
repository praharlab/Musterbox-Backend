const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'visitReportCustomize';
const CompanyMaster = require('./companyMaster');
const VisitReportMaster = require('./visitReportMaster');
const VisitReportCustomize = sequelize.define(table_name, {
  visitReportCustomizeID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  fieldLabel: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  inputType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  value: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
  isRequired: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
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

VisitReportCustomize.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
VisitReportCustomize.belongsTo(VisitReportMaster, {
  foreignKey: { name: 'visitReportMasterID' },
});
module.exports = VisitReportCustomize;
