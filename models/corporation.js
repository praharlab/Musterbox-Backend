const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const StateMaster = require('./statemaster');

const Corporation = sequelize.define(
  'corporation',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    corporationName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    stateMasterID: {
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

Corporation.addHook('beforeCreate', async(Corporation, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  Corporation.createBy = options.user.userMasterId;
  Corporation.createByIp = options.user.userIpAddress;
});

Corporation.addHook('beforeUpdate', (Corporation, options) => {
  Corporation.updateBy = options.user.userMasterId;
  Corporation.updateByIp = options.user.userIpAddress;
});

Corporation.addHook('beforeDestroy', (Corporation, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  Corporation.deleteBy = options.user.userMasterId;
  Corporation.deleteByIp = options.user.userIpAddress;
});

Corporation.belongsTo(StateMaster, {
  foreignKey: { name: 'stateMasterID' },
});


module.exports = Corporation;
