const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const usermaster = require('./userMaster');
const userExpenseTransaction = require('./userExpenseTransaction');
const userExpense = require('./userExpense');
const table_name = 'expenseAuthorization';
const ExpenseAuthorizationRequest = sequelize.define(
  table_name,
  {
    AuthorizationRequestId: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    // userExpenseTransactionId
    ReferenceID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    // id of approver
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    authstatus: {
      type: Sequelize.INTEGER,
      allowNull: true, // 1=> Accept 2=> Pending 0=> Reject
    },
    remarks: {
      type: Sequelize.TEXT,
      allowNull: true,
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
    viewstatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['ReferenceID', 'userMasterID', 'status', 'authstatus'],
      },
    ],
  }
);
ExpenseAuthorizationRequest.belongsTo(usermaster, {
  foreignKey: { name: 'createBy' },
});

ExpenseAuthorizationRequest.belongsTo(userExpenseTransaction, {
  foreignKey: { name: 'ReferenceID' },
});

ExpenseAuthorizationRequest.belongsTo(usermaster, {
  as: 'authorizedPerson',
  foreignKey: { name: 'userMasterID' },
});

userExpenseTransaction.hasMany(ExpenseAuthorizationRequest, {
  foreignKey: { name: 'ReferenceID' },
});
userExpenseTransaction.hasMany(ExpenseAuthorizationRequest, {
  as: 'Auth',
  foreignKey: { name: 'ReferenceID' },
});
module.exports = ExpenseAuthorizationRequest;
