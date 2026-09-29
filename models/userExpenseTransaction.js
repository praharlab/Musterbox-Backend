const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserExpense = require('./userExpense');
const expensehead = require('./expenseHead');
const expensepricerule = require('./expencePriceRule');
const table_name = 'userExpenseTransaction';
const expensePayment = require('./expensePayment');
const AuthorizationCriteriaMaster = require('./authorizationCriteriaMaster');
const UserExpenseTransaction = sequelize.define(
  table_name,
  {
    userExpenseTransactionID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    oldExpenseTransID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    userExpenseID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    expenseHeadId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    expensePriceRuleID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    expenseAmount: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    attachFile: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    attachFile2: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    attachFile3: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    attachFile4: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    erpJvid: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    authorizationStatus: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
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
    payment_Id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    syncType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
    AuthorizationCriteriaID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
  },
  {
    paranoid: true,
    indexes: [
      {
        unique: false,
        fields: ['userExpenseID', 'status', 'authorizationStatus', 'deletedAt'],
      },
    ],
  }
);

UserExpenseTransaction.belongsTo(UserExpense, {
  as: 'userExpense',
  foreignKey: { name: 'userExpenseID' },
});
UserExpense.hasMany(UserExpenseTransaction, {
  foreignKey: { name: 'userExpenseID' },
});
UserExpenseTransaction.belongsTo(expensehead, {
  foreignKey: { name: 'expenseHeadId' },
});
UserExpenseTransaction.belongsTo(expensePayment, {
  foreignKey: { name: 'payment_Id' },
});

UserExpenseTransaction.belongsTo(AuthorizationCriteriaMaster, {
  foreignKey: { name: 'AuthorizationCriteriaID' },
});

UserExpense.hasMany(UserExpenseTransaction, {
  as: 'ut',
  foreignKey: { name: 'userExpenseID' },
});

UserExpenseTransaction.belongsTo(expensehead, {
  as: 'eh',
  foreignKey: { name: 'expenseHeadId' },
});
module.exports = UserExpenseTransaction;
