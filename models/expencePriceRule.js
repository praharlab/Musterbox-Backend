const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'expensePriceRule';
const ExpenseHead = require('./expenseHead');
const ExpensePriceRule = sequelize.define(table_name, {
  expensePriceRuleID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  expenseHeadId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  rule: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  applicableDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATE,
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

ExpensePriceRule.belongsTo(ExpenseHead, {
  as: 'expensehead',
  foreignKey: { name: 'expenseHeadId' },
});

module.exports = ExpensePriceRule;
