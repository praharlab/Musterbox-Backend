const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'biometricUser';

const biometricUser = sequelize.define(
  table_name,
  {
    biometricUserID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    biometricUserSerialNo: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    enrollid: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isAdmin: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    face: {
      type: Sequelize.STRING,
      allowNull: true,
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

biometricUser.addHook('beforeCreate', (biometricUser, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  biometricUser.createBy = options.user.userMasterId;
  biometricUser.createByIp = options.user.userIpAddress;
});

biometricUser.addHook('beforeUpdate', (biometricUser, options) => {
  biometricUser.updateBy = options.user.userMasterId;
  biometricUser.updateByIp = options.user.userIpAddress;
});

biometricUser.addHook('beforeDestroy', (biometricUser, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  biometricUser.deleteBy = options.user.userMasterId;
  biometricUser.deleteByIp = options.user.userIpAddress;
});

module.exports = biometricUser;
