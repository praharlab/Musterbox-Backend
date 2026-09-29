const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const tdsSubSection = require('./tdsSubSection');

const TdsSubSectionCategory = sequelize.define(
  'tdsSubSectionCategory',
  {
    tdsSubSectionCategoryID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    categoryName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    createByIp: {
      type: Sequelize.STRING,
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

TdsSubSectionCategory.addHook(
  'beforeCreate',
  (tdsSubSectionCategory, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    tdsSubSectionCategory.createBy = options.user.userMasterId;
    tdsSubSectionCategory.updateBy = options.user.userMasterId;
    tdsSubSectionCategory.createByIp = options.user.userIpAddress;
    tdsSubSectionCategory.updateByIp = options.user.userIpAddress;
  }
);

TdsSubSectionCategory.addHook(
  'beforeUpdate',
  (tdsSubSectionCategory, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    tdsSubSectionCategory.updateBy = options.user.userMasterId;
    tdsSubSectionCategory.updateByIp = options.user.userIpAddress;
  }
);

TdsSubSectionCategory.addHook(
  'beforeDestroy',
  (tdsSubSectionCategory, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    tdsSubSectionCategory.deleteBy = options.user.userMasterId;
    tdsSubSectionCategory.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = TdsSubSectionCategory;
