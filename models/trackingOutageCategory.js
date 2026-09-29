const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const trackingOutageCategoryDetails = require('./trackingCategoryDetails');
const table_name = 'TrackingOutageCategories';
const trackingOutageCategory = sequelize.define(
  table_name,
  {
    trackingCategoryID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    categoryName: {
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

trackingOutageCategory.hasMany(trackingOutageCategoryDetails, {
  foreignKey: 'trackingCategoryID',
});

trackingOutageCategoryDetails.belongsTo(trackingOutageCategory, {
  foreignKey: 'trackingCategoryID',
});

trackingOutageCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
});

trackingOutageCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
});

trackingOutageCategory.addHook(
  'beforeCreate',
  (trackingOutageCategory, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    trackingOutageCategory.createBy = options.user.userMasterId;
    trackingOutageCategory.updateBy = options.user.userMasterId;
    trackingOutageCategory.createByIp = options.user.userIpAddress;
    trackingOutageCategory.updateByIp = options.user.userIpAddress;
  }
);

trackingOutageCategory.addHook(
  'beforeUpdate',
  (trackingOutageCategory, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    trackingOutageCategory.updateBy = options.user.userMasterId;
    trackingOutageCategory.updateByIp = options.user.userIpAddress;
  }
);

trackingOutageCategory.addHook(
  'beforeDestroy',
  (trackingOutageCategory, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    trackingOutageCategory.deleteBy = options.user.userMasterId;
    trackingOutageCategory.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = trackingOutageCategory;
