const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const CompanyServiceStatus = require('./companyServiceStatus');
const table_name = 'companyProgress';
const CompanyProgress = sequelize.define(
  table_name,
  {
    companyProgressID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    //forgein Key
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    CompanyServiceStatusID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    // userMasterID: {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    // },
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

CompanyProgress.addHook('beforeCreate', (companyProgress, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  companyProgress.createBy = options.user.userMasterId;
  companyProgress.updateBy = options.user.userMasterId;
  companyProgress.createByIp = options.user.userIpAddress;
  companyProgress.updateByIp = options.user.userIpAddress;
});

CompanyProgress.addHook('beforeUpdate', (companyProgress, options) => {
  companyProgress.updateBy = options.user.userMasterId;
  companyProgress.ipAddress = options.user.userIpAddress;
  companyProgress.updateByIp = options.user.userIpAddress;
});

CompanyProgress.addHook('beforeDestroy', (companyProgress, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  companyProgress.deleteBy = options.user.userMasterId;
  companyProgress.deleteByIp = options.user.userIpAddress;
});

CompanyProgress.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

CompanyProgress.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdBy',
});

CompanyProgress.belongsTo(CompanyServiceStatus, {
  foreignKey: { name: 'CompanyServiceStatusID' },
});
CompanyServiceStatus.hasMany(CompanyProgress, {
  foreignKey: { name: 'CompanyServiceStatusID' },
});

module.exports = CompanyProgress;
