const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'customizeProfile';
const CustomizeProfile = sequelize.define(
  table_name,
  {
    customizeProfileID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    companyMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    fields: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
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
CustomizeProfile.addHook('beforeCreate', (customizeProfile, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  customizeProfile.createBy = options.user.userMasterId;
  customizeProfile.updateBy = options.user.userMasterId;
  customizeProfile.createByIp = options.user.userIpAddress;
  customizeProfile.updateByIp = options.user.userIpAddress;
});

CustomizeProfile.addHook('beforeUpdate', (customizeProfile, options) => {
  customizeProfile.updateBy = options.user.userMasterId;
  customizeProfile.ipAddress = options.user.userIpAddress;
  customizeProfile.updateByIp = options.user.userIpAddress;
});

CustomizeProfile.addHook('beforeDestroy', (customizeProfile, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  customizeProfile.deleteBy = options.user.userMasterId;
  customizeProfile.deleteByIp = options.user.userIpAddress;
});

CustomizeProfile.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

companyMaster.hasMany(CustomizeProfile, {
  foreignKey: { name: 'companyMasterID' },
});
module.exports = CustomizeProfile;
