const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { bonusPaymentMode } = require('../utils/dbUtils');

const EmployeePayment = sequelize.define('employeePayment', {
  employeePaymentId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  amount: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  paymentDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },

  paymentMode: {
    type: Sequelize.ENUM(...Object.values(bonusPaymentMode)),
    allowNull: true,
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
});

EmployeePayment.addHook('beforeCreate', (EmployeePayment, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  EmployeePayment.createBy = options.user.userMasterId;
  EmployeePayment.createByIp = options.user.userIpAddress;
});

EmployeePayment.addHook('beforeUpdate', (EmployeePayment, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  EmployeePayment.updateBy = options.user.userMasterId;
  EmployeePayment.updateByIp = options.user.userIpAddress;
});

EmployeePayment.belongsTo(UserMaster, {
  as: 'createdBy',
  foreignKey: { name: 'createBy' },
});

EmployeePayment.belongsTo(UserMaster, {
  as: 'updatedBy',
  foreignKey: { name: 'updateBy' },
});


module.exports = EmployeePayment;
