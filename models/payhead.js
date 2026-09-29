const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { TaxApplicabilityType } = require('../utils/dbUtils');
const table_name = 'Payheadmaster';
const Payheadmaster = sequelize.define(table_name, {
  payheadMasterId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  payheadName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  payheadDesc: {
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
  taxApplicability: {
    type: Sequelize.ENUM(...Object.values(TaxApplicabilityType)),
    allowNull: false,
    defaultValue: TaxApplicabilityType.NOT_APPLICABLE,
  },
});

module.exports = Payheadmaster;
