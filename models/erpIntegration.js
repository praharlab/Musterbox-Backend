const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'erpIntegration';
const erpIntegration = sequelize.define(
  table_name,
  {
    erpIntegrationID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    erpName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    baseUrl: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    empCodeUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    apiKey: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    apiSecret: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    // forgein key
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    advanceExpenceUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    expenseUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    expenseHeadUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    salarySyncUrl: {
      type: Sequelize.STRING,
      allowNull: true,
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

erpIntegration.addHook('beforeCreate', (erpIntegration, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  erpIntegration.createBy = options.user.userMasterId;
  erpIntegration.updateBy = options.user.userMasterId;
  erpIntegration.createByIp = options.user.userIpAddress;
  erpIntegration.updateByIp = options.user.userIpAddress;
});

erpIntegration.addHook('beforeUpdate', (erpIntegration, options) => {
  erpIntegration.updateBy = options.user.userMasterId;
  erpIntegration.ipAddress = options.user.userIpAddress;
  erpIntegration.updateByIp = options.user.userIpAddress;
});

erpIntegration.addHook('beforeDestroy', (erpIntegration, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  erpIntegration.deleteBy = options.user.userMasterId;
  erpIntegration.deleteByIp = options.user.userIpAddress;
});

erpIntegration.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

companyMaster.hasMany(erpIntegration, {
  foreignKey: { name: 'companyMasterID' },
});
module.exports = erpIntegration;
