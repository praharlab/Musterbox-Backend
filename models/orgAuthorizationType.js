const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'orgAuthorizationType';
const OrgAuthorizationType = sequelize.define(
  table_name,
  {
    orgAuthorizationTypeID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    orgAuthorizationType: {
      type: Sequelize.STRING,
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
    paranoid: true
  }
);
OrgAuthorizationType.addHook('beforeCreate', (orgAuthorizationType, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    orgAuthorizationType.createBy = options.user.userMasterId;
    orgAuthorizationType.updateBy = options.user.userMasterId;
    orgAuthorizationType.createByIp = options.user.userIpAddress;
    orgAuthorizationType.updateByIp = options.user.userIpAddress;
});

OrgAuthorizationType.addHook('beforeUpdate', (orgAuthorizationType, options) => {
    orgAuthorizationType.updateBy = options.user.userMasterId;
    orgAuthorizationType.ipAddress = options.user.userIpAddress;
    orgAuthorizationType.updateByIp = options.user.userIpAddress;
});

OrgAuthorizationType.addHook('beforeDestroy', (orgAuthorizationType, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    orgAuthorizationType.deleteBy = options.user.userMasterId;
    orgAuthorizationType.deleteByIp = options.user.userIpAddress;
});

module.exports = OrgAuthorizationType;
