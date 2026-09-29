const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'companyServiceStatus';
const CompanyServiceStatus = sequelize.define(
  table_name,
  {
    CompanyServiceStatusID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    CompanyServiceStatusName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    colorCode: {
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

CompanyServiceStatus.addHook(
  'beforeCreate',
  (companyServiceStatus, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    companyServiceStatus.createBy = options.user.userMasterId;
    companyServiceStatus.updateBy = options.user.userMasterId;
    companyServiceStatus.createByIp = options.user.userIpAddress;
    companyServiceStatus.updateByIp = options.user.userIpAddress;
  }
);

CompanyServiceStatus.addHook(
  'beforeUpdate',
  (companyServiceStatus, options) => {
    companyServiceStatus.updateBy = options.user.userMasterId;
    companyServiceStatus.ipAddress = options.user.userIpAddress;
    companyServiceStatus.updateByIp = options.user.userIpAddress;
  }
);

CompanyServiceStatus.addHook(
  'beforeDestroy',
  (companyServiceStatus, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    companyServiceStatus.deleteBy = options.user.userMasterId;
    companyServiceStatus.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = CompanyServiceStatus;
