const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'ESICSetup';
const ESICSetup = sequelize.define(table_name, {
  ESICSetupID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  ESICStatus: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
  grossSalaryForESIC: {
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
  ESICEmployee: {
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
  ESICEmployer: {
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
  hideESICEmployeePaySlip: {
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

ESICSetup.belongsTo(companyMaster, { foreignKey: { name: 'companyMasterID' } });

module.exports = ESICSetup;
