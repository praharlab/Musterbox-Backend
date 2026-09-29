const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const table_name = 'dealerPlan';
const dealerPlan = sequelize.define(
  table_name,
  {
    dealerPlanID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    planName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    Description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    numberOfEmployee: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    numberOfCompany: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    features: {
      allowNull: true,
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
dealerPlan.addHook('beforeCreate', (dealerPlan, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  dealerPlan.createBy = options.user.userMasterId;
  dealerPlan.updateBy = options.user.userMasterId;
  dealerPlan.createByIp = options.user.userIpAddress;
  dealerPlan.updateByIp = options.user.userIpAddress;
});

dealerPlan.addHook('beforeUpdate', (dealerPlan, options) => {
  dealerPlan.updateBy = options.user.userMasterId;
  dealerPlan.ipAddress = options.user.userIpAddress;
  dealerPlan.updateByIp = options.user.userIpAddress;
});

dealerPlan.addHook('beforeDestroy', (dealerPlan, options) => {
  dealerPlan.deleteBy = options.user.userMasterId;
  dealerPlan.deleteByIp = options.user.userIpAddress;
});

// dealerPlan.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = dealerPlan;
