const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'incentivetype';
const Incentivetype = sequelize.define(table_name, {
  IncentivetypeID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  companyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  incentivetypename: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  showinsalaryslip: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  consider: {
    type: Sequelize.STRING,
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
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  pfApplicable: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  esicApplicable: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  employeeESICPer: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  employerESICPer: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  inc_type_displayName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

Incentivetype.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = Incentivetype;
