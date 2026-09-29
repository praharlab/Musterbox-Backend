const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'expenseHead';
const CompanyMaster = require('./companyMaster');
const ExpenseCategory = require('./expenseCategory');
const ExpenseHead = sequelize.define(table_name, {
  expenseHeadId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  expenseHead: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  expenseCategoryId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  // accountHeadID: {
  //   type: Sequelize.INTEGER,
  //   allowNull: true,
  // },
  accountHeadID: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.BIGINT,
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

ExpenseHead.belongsTo(ExpenseCategory, {
  foreignKey: { name: 'expenseCategoryId' },
});
ExpenseHead.belongsTo(ExpenseCategory, {
  as: 'ec',
  foreignKey: { name: 'expenseCategoryId' },
});
ExpenseHead.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
module.exports = ExpenseHead;
