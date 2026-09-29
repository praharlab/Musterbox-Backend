const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const BankMaster = require('./bankMaster');
const table_name = 'bankBranch';

const BankBranch = sequelize.define(
  table_name,
  {
    bankBranchID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    bankBranchName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    bankBranchCode: {
      type: Sequelize.STRING,
      allowNull: false,
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
  { paranoid: true }
);

BankBranch.addHook('beforeCreate', (bankBranch, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  bankBranch.createBy = options.user.userMasterId;
  bankBranch.updateBy = options.user.userMasterId;
  bankBranch.createByIp = options.user.userIpAddress;
  bankBranch.updateByIp = options.user.userIpAddress;
});

BankBranch.addHook('beforeUpdate', (bankBranch, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  bankBranch.updateBy = options.user.userMasterId;
  bankBranch.ipAddress = options.user.userIpAddress;
  bankBranch.updateByIp = options.user.userIpAddress;
});

BankBranch.addHook('beforeDestroy', (bankBranch, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  bankBranch.deleteBy = options.user.userMasterId;
  bankBranch.deleteByIp = options.user.userIpAddress;
});
BankBranch.belongsTo(BankMaster, { foreignKey: { name: 'bankMasterID' } });
module.exports = BankBranch;
