const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const table_name = 'aiBiometric';
const AiBiometric = sequelize.define(
  table_name,
  {
    aiBiometricID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    serialNo: {
      type: Sequelize.BIGINT,
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
AiBiometric.addHook('beforeCreate', (aiBiometric, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  aiBiometric.createBy = options.user.userMasterId;
  aiBiometric.updateBy = options.user.userMasterId;
  aiBiometric.createByIp = options.user.userIpAddress;
  aiBiometric.updateByIp = options.user.userIpAddress;
});

AiBiometric.addHook('beforeUpdate', (aiBiometric, options) => {
  aiBiometric.updateBy = options.user.userMasterId;
  aiBiometric.ipAddress = options.user.userIpAddress;
  aiBiometric.updateByIp = options.user.userIpAddress;
});

AiBiometric.addHook('beforeDestroy', (aiBiometric, options) => {
  aiBiometric.deleteBy = options.user.userMasterId;
  aiBiometric.deleteByIp = options.user.userIpAddress;
});

AiBiometric.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = AiBiometric;
