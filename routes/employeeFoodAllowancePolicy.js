const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const FoodAllowancePolicy = require('./foodAllowancePolicy');

const EmployeeFoodAllowancePolicy = sequelize.define(
  'employeeFoodAllowancePolicy',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DATEONLY,
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

EmployeeFoodAllowancePolicy.addHook(
  'beforeCreate',
  (employeeFoodAllowancePolicy, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    employeeFoodAllowancePolicy.createBy = options.user.userMasterId;
    employeeFoodAllowancePolicy.updateBy = options.user.userMasterId;
    employeeFoodAllowancePolicy.createByIp = options.user.userIpAddress;
    employeeFoodAllowancePolicy.updateByIp = options.user.userIpAddress;
  }
);

EmployeeFoodAllowancePolicy.addHook(
  'beforeUpdate',
  (employeeFoodAllowancePolicy, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    employeeFoodAllowancePolicy.updateBy = options.user.userMasterId;
    employeeFoodAllowancePolicy.ipAddress = options.user.userIpAddress;
    employeeFoodAllowancePolicy.updateByIp = options.user.userIpAddress;
  }
);

EmployeeFoodAllowancePolicy.addHook(
  'beforeDestroy',
  (employeeFoodAllowancePolicy, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    employeeFoodAllowancePolicy.deleteBy = options.user.userMasterId;
    employeeFoodAllowancePolicy.deleteByIp = options.user.userIpAddress;
  }
);

EmployeeFoodAllowancePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeFoodAllowancePolicy.belongsTo(FoodAllowancePolicy, {
  foreignKey: { name: 'foodAllowancePolicyId' },
});
UserMaster.hasMany(EmployeeFoodAllowancePolicy, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = EmployeeFoodAllowancePolicy;
