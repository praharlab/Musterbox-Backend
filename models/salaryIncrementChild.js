const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const salaryIncrement = require('./salaryIncrement');
const gradeSalaryStructure = require('./gradeSalaryStructure');
const table_name = 'salaryIncrementChild';
const salaryIncrementChild = sequelize.define(table_name, {
  salaryIncrementChildID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  salaryIncrementID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  gradeSalaryStructureID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  salaryIncrementPercentage: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  salaryIncrementAmount: {
    type: Sequelize.INTEGER,
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

salaryIncrementChild.belongsTo(salaryIncrement, {
  foreignKey: { name: 'salaryIncrementID' },
});
salaryIncrementChild.belongsTo(gradeSalaryStructure, {
  foreignKey: { name: 'gradeSalaryStructureID' },
});

module.exports = salaryIncrementChild;
