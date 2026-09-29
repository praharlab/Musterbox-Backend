const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const usermaster = require('./userMaster');
const table_name = 'outsideNotification';
const OutsideNotification = sequelize.define(
  table_name,
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    outDatetime: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    inDatetime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    minutes: {
      type: Sequelize.FLOAT,
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
    indexes: [
      {
        unique: false,
        fields: ['userMasterID', 'date'],
      },
    ],
  }
);

OutsideNotification.belongsTo(usermaster, {
  foreignKey: { name: 'createBy' },
});
OutsideNotification.belongsTo(usermaster, {
  foreignKey: { name: 'updateBy' },
});
OutsideNotification.belongsTo(usermaster, {
  foreignKey: { name: 'deleteBy' },
});
OutsideNotification.belongsTo(usermaster, {
  foreignKey: { name: 'userMasterID' },
});

OutsideNotification.addHook('beforeCreate', (division, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  division.createBy = options.user.userMasterId;
  division.createByIp = options.user.userIpAddress;
});

OutsideNotification.addHook('beforeUpdate', (division, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  division.updateBy = options.user.userMasterId;
  division.updateByIp = options.user.userIpAddress;
});

OutsideNotification.addHook('beforeDestroy', (division, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  division.deleteBy = options.user.userMasterId;
  division.deleteByIp = options.user.userIpAddress;
});
module.exports = OutsideNotification;
