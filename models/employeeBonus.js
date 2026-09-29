const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { bonusPaymentMode } = require('../utils/dbUtils');
const HRSalaryTrasaction = require('./hrSalaryTransaction');
const EmployeePayment = require('./employeePayment');

const EmployeeBonus = sequelize.define('employeeBonus', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  amount: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  bonusYYYYMM: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  payYYYYMM: {
    type: Sequelize.INTEGER,
  },
  referenceId: {
    type: Sequelize.BIGINT,
  },

  payReferenceId: {
    type: Sequelize.BIGINT,
  },

  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.INTEGER,
  },
  updateBy: {
    type: Sequelize.INTEGER,
  },
  createByIp: {
    type: Sequelize.STRING,
  },
  updateByIp: {
    type: Sequelize.STRING,
  },
  employeePaymentId: {
    type: Sequelize.BIGINT,
  },
});

EmployeeBonus.addHook('beforeCreate', (EmployeeBonus, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  EmployeeBonus.createBy = options.user.userMasterId;
  EmployeeBonus.createByIp = options.user.userIpAddress;
});

EmployeeBonus.addHook('beforeUpdate', (EmployeeBonus, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  EmployeeBonus.updateBy = options.user.userMasterId;
  EmployeeBonus.updateByIp = options.user.userIpAddress;
});

EmployeeBonus.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(EmployeeBonus, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeBonus.belongsTo(UserMaster, {
  as: 'createdBy',
  foreignKey: { name: 'createBy' },
});

EmployeeBonus.belongsTo(UserMaster, {
  as: 'updatedBy',
  foreignKey: { name: 'updateBy' },
});

EmployeeBonus.belongsTo(HRSalaryTrasaction, {
  as: 'addBonus',
  foreignKey: { name: 'referenceId' },
});

EmployeeBonus.belongsTo(HRSalaryTrasaction, {
  as: 'payBonus',
  foreignKey: { name: 'payReferenceId' },
});

EmployeeBonus.belongsTo(EmployeePayment, {
  foreignKey: { name: 'employeePaymentId' },
});

EmployeePayment.hasMany(EmployeeBonus, {
  foreignKey: { name: 'employeePaymentId' },
});

module.exports = EmployeeBonus;
