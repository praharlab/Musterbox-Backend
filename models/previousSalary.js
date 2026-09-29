const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Payheadmaster = require('./payhead');

const PreviousSalary = sequelize.define(
  'previousSalary',
  {
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
    yearMonth: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    amount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    payheadMasterId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    salaryFieldSrNo: {
      type: Sequelize.TEXT,
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

PreviousSalary.addHook('beforeCreate', (previousSalary, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  previousSalary.createBy = options.user.userMasterId;
  previousSalary.updateBy = options.user.userMasterId;
  previousSalary.createByIp = options.user.userIpAddress;
  previousSalary.updateByIp = options.user.userIpAddress;
});

PreviousSalary.addHook('beforeUpdate', (previousSalary, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  previousSalary.updateBy = options.user.userMasterId;
  previousSalary.ipAddress = options.user.userIpAddress;
  previousSalary.updateByIp = options.user.userIpAddress;
});

PreviousSalary.addHook('beforeDestroy', (previousSalary, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  previousSalary.deleteBy = options.user.userMasterId;
  previousSalary.deleteByIp = options.user.userIpAddress;
});

PreviousSalary.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
PreviousSalary.belongsTo(Payheadmaster, {
  foreignKey: { name: 'payheadMasterId' },
});

module.exports = PreviousSalary;
