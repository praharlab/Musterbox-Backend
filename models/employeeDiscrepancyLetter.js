const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const DiscrepancyLetter = require('./discrepancyLetter');
const table_name = 'employeeDiscrepancyLetter';

const EmployeeDiscrepancyLetter = sequelize.define(
  table_name,
  {
    employeeDiscrepancyLetterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    discrepancyLetterHTML: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    path: {
      type: Sequelize.STRING,
      allowNull: true,
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
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  {
    paranoid: true,
  }
);

EmployeeDiscrepancyLetter.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeDiscrepancyLetter.belongsTo(DiscrepancyLetter, {
  foreignKey: { name: 'discrepancyLetterID' },
});

EmployeeDiscrepancyLetter.addHook(
  'beforeCreate',
  (employeeDiscrepancyLetter, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    employeeDiscrepancyLetter.createBy = options.user.userMasterId;
    employeeDiscrepancyLetter.updateBy = options.user.userMasterId;
    employeeDiscrepancyLetter.createByIp = options.user.userIpAddress;
    employeeDiscrepancyLetter.updateByIp = options.user.userIpAddress;
  }
);

EmployeeDiscrepancyLetter.addHook(
  'beforeUpdate',
  (employeeDiscrepancyLetter, options) => {
    employeeDiscrepancyLetter.updateBy = options.user.userMasterId;
    employeeDiscrepancyLetter.ipAddress = options.user.userIpAddress;
    employeeDiscrepancyLetter.updateByIp = options.user.userIpAddress;
  }
);

EmployeeDiscrepancyLetter.addHook(
  'beforeDestroy',
  (employeeDiscrepancyLetter, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    employeeDiscrepancyLetter.deleteBy = options.user.userMasterId;
    employeeDiscrepancyLetter.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = EmployeeDiscrepancyLetter;
