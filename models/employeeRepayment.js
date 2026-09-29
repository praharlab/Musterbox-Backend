const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { employeeRepaymentType, paymentMode } = require('../utils/dbUtils');
const advancePayment = require('./advancePayment');
const EmployeePenalty = require('./employeePenalty');

const EmployeeRepayment = sequelize.define(
  'employeeRepayment',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: Sequelize.ENUM(...Object.values(employeeRepaymentType)),
      allowNull: false,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    salaryMonth: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    amount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    paymentMode: {
      type: Sequelize.ENUM(...Object.values(paymentMode)),
      allowNull: false,
    },

    referenceNO: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateBy: {
      type: Sequelize.BIGINT,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteBy: {
      type: Sequelize.BIGINT,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  { paranoid: true }
);

EmployeeRepayment.belongsTo(advancePayment, {
  foreignKey: { name: 'advancePaymentID' },
});

advancePayment.hasMany(EmployeeRepayment, {
  foreignKey: { name: 'advancePaymentID' },
});

EmployeeRepayment.belongsTo(EmployeePenalty, {
  foreignKey: { name: 'employeePenaltyID' },
});

EmployeePenalty.hasMany(EmployeeRepayment, {
  foreignKey: { name: 'employeePenaltyID' },
});

EmployeeRepayment.addHook('beforeCreate', (EmployeeRepayment, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  EmployeeRepayment.createBy = options.user.userMasterId;
  EmployeeRepayment.createByIp = options.user.userIpAddress;
});

EmployeeRepayment.addHook(
  'beforeUpdate',
  async (EmployeeRepayment, options) => {
    // Set updatedBy and ipAddress based on the authenticated user
    EmployeeRepayment.updateBy = options.user.userMasterId;
    EmployeeRepayment.updateByIp = options.user.userIpAddress;
  }
);

EmployeeRepayment.addHook('beforeDestroy', (EmployeeRepayment, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  EmployeeRepayment.deleteBy = options.user.userMasterId;
  EmployeeRepayment.deleteByIp = options.user.userIpAddress;
});

module.exports = EmployeeRepayment;
