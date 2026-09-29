const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const Department = require('./department');
const table_name = 'resignProcess';
const ResignProcess = sequelize.define(table_name, {
  resignProcessID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  departmentID: {
    type: Sequelize.INTEGER,
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
});

ResignProcess.belongsTo(companyMaster, {
  as: 'company',
  foreignKey: { name: 'companyMasterID' },
});
ResignProcess.belongsTo(Department, {
  as: 'department',
  foreignKey: { name: 'departmentID' },
});

module.exports = ResignProcess;
