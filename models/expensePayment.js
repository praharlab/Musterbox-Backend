const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const companyMaster = require('./companyMaster');
const table_name = 'expensePayment';
const expensePayment = sequelize.define(table_name, {
  ExpensePaymentID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  amount: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  paymentDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  paymentmode: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  referenceNO: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  referenceDate: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  paymentType: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  erpNo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  remarks: {
    type: Sequelize.STRING,
    allowNull: true,
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
});

expensePayment.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = expensePayment;
