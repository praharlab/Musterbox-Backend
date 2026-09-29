const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const dealerPlan = require('./dealerPlan');
const table_name = 'dealerSubscription';
const dealerSubscription = sequelize.define(
  table_name,
  {
    dealerSubscriptionID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    dealerPlanID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    noOfEmployee: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    noOfCompany: {
      type: Sequelize.BIGINT,
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
  {
    paranoid: true,
  }
);
dealerSubscription.addHook('beforeCreate', (dealerSubscription, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  dealerSubscription.createBy = options.user.userMasterId;
  dealerSubscription.updateBy = options.user.userMasterId;
  dealerSubscription.createByIp = options.user.userIpAddress;
  dealerSubscription.updateByIp = options.user.userIpAddress;
});

dealerSubscription.addHook('beforeUpdate', (dealerSubscription, options) => {
  dealerSubscription.updateBy = options.user.userMasterId;
  dealerSubscription.ipAddress = options.user.userIpAddress;
  dealerSubscription.updateByIp = options.user.userIpAddress;
});

dealerSubscription.addHook('beforeDestroy', (dealerSubscription, options) => {
  dealerSubscription.deleteBy = options.user.userMasterId;
  dealerSubscription.deleteByIp = options.user.userIpAddress;
});

// dealerSubscription.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });

dealerSubscription.belongsTo(dealerPlan, {
  foreignKey: { name: 'dealerPlanID' },
});
dealerSubscription.belongsTo(userMaster, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = dealerSubscription;
