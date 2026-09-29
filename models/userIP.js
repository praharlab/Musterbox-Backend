const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const table_name = 'userIP';
const userIP = sequelize.define(
  table_name,
  {
    useripID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    ip: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
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
userIP.addHook('beforeCreate', (userIP, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  userIP.createBy = options.user.userMasterId;
  userIP.updateBy = options.user.userMasterId;
  userIP.createByIp = options.user.userIpAddress;
  userIP.updateByIp = options.user.userIpAddress;
});

userIP.addHook('beforeUpdate', (userIP, options) => {
  userIP.updateBy = options.user.userMasterId;
  userIP.ipAddress = options.user.userIpAddress;
  userIP.updateByIp = options.user.userIpAddress;
});

userIP.addHook('beforeDestroy', (userIP, options) => {
  userIP.deleteBy = options.user.userMasterId;
  userIP.deleteByIp = options.user.userIpAddress;
});

userIP.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = userIP;
