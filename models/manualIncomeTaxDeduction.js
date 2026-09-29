const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const table_name = 'manualIncomeTaxdeduction';

const manualIncomeTaxdeduction = sequelize.define(
  table_name,
  {
    manualIncomeTaxdeductionID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    yearMonth: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    amount: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleteBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true }
);

manualIncomeTaxdeduction.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

manualIncomeTaxdeduction.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'manualIncomeTaxdeductionCreatedBy',
});

manualIncomeTaxdeduction.addHook('beforeCreate', (manualdeduction, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  manualdeduction.createBy = options.user.userMasterId;
  manualdeduction.updateBy = options.user.userMasterId;
  manualdeduction.createByIp = options.user.userIpAddress;
  manualdeduction.updateByIp = options.user.userIpAddress;
});

manualIncomeTaxdeduction.addHook('beforeUpdate', (manualdeduction, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  manualdeduction.updateBy = options.user.userMasterId;
  manualdeduction.updateByIp = options.user.userIpAddress;
});

manualIncomeTaxdeduction.addHook(
  'beforeDestroy',
  (manualdeduction, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    manualdeduction.deleteBy = options.user.userMasterId;
    manualdeduction.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = manualIncomeTaxdeduction;
