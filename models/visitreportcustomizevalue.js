const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'visitReportCustomizeValue';
const visitReportCustomize = require('./visitreportcustomize');

const VisitReportCustomizeValue = sequelize.define(table_name, {
  visitReportCustomizeValueID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  visitReportCustomizeID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  visitID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  value: {
    type: Sequelize.TEXT,
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

VisitReportCustomizeValue.belongsTo(visitReportCustomize, {
  foreignKey: { name: 'visitReportCustomizeID' },
});
module.exports = VisitReportCustomizeValue;
