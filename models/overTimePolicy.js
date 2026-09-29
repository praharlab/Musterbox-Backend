const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'OverTimePolicy';
const CompanyMaster = require('./companyMaster');

const overTimePolicy = sequelize.define(table_name, {
  overTimePolicyID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },

  companyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },

  overtimePolicyName: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  overtimeSkipMin: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  afterOvertimeCalculationHour: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  createBy: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },

  createByIp: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  updateBy: {
    type: Sequelize.BIGINT,
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

overTimePolicy.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
module.exports = overTimePolicy;
