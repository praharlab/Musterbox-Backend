const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'TrackingOutageCategoryDetails';

const trackingOutageCategoryDetails = sequelize.define(
  table_name,
  {
    categoryDetailsID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    trackingCategoryID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
    },
    updateBy: {
      type: Sequelize.BIGINT,
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

trackingOutageCategoryDetails.addHook(
  'beforeCreate',
  (trackingOutageCategoryDetails, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    trackingOutageCategoryDetails.createBy = options.user.userMasterId;
    trackingOutageCategoryDetails.updateBy = options.user.userMasterId;
    trackingOutageCategoryDetails.createByIp = options.user.userIpAddress;
    trackingOutageCategoryDetails.updateByIp = options.user.userIpAddress;
  }
);

trackingOutageCategoryDetails.addHook(
  'beforeUpdate',
  (trackingOutageCategoryDetails, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    trackingOutageCategoryDetails.updateBy = options.user.userMasterId;
    trackingOutageCategoryDetails.updateByIp = options.user.userIpAddress;
  }
);

trackingOutageCategoryDetails.addHook(
  'beforeDestroy',
  (trackingOutageCategoryDetails, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    trackingOutageCategoryDetails.deleteBy = options.user.userMasterId;
    trackingOutageCategoryDetails.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = trackingOutageCategoryDetails;
