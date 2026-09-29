/** @format */

const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const StateMaster = require('./statemaster');
const UserMaster = require('./userMaster');
const companyMaster = require('./companyMaster');

const MinWagesMaster = sequelize.define(
  'minWagesMaster',
  {
    id: {
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      type: Sequelize.INTEGER,
    },
    skilled: {
      type: Sequelize.FLOAT,
    },
    semiSkilled: {
      type: Sequelize.FLOAT,
    },
    unSkilled: {
      type: Sequelize.FLOAT,
    },
    applicableYYYYMM: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    stateMasterId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    companyMasterId: {
      type: Sequelize.INTEGER,
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
    paranoid: true,
  }
);

MinWagesMaster.addHook('beforeCreate', (MinWagesMaster, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  MinWagesMaster.createBy = options.user.userMasterId;
  MinWagesMaster.createByIp = options.user.userIpAddress;
});

MinWagesMaster.addHook('beforeUpdate', (MinWagesMaster, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  MinWagesMaster.updateBy = options.user.userMasterId;
  MinWagesMaster.updateByIp = options.user.userIpAddress;
});

MinWagesMaster.addHook('beforeDestroy', (MinWagesMaster, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  MinWagesMaster.deleteBy = options.user.userMasterId;
  MinWagesMaster.deleteByIp = options.user.userIpAddress;
});

MinWagesMaster.belongsTo(StateMaster, {
  foreignKey: { name: 'stateMasterId' },
});

MinWagesMaster.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterId' },
});

MinWagesMaster.belongsTo(UserMaster, {
  as: 'createdByUser',
  foreignKey: { name: 'createBy' },
});

MinWagesMaster.belongsTo(UserMaster, {
  as: 'updatedByUser',
  foreignKey: { name: 'updateBy' },
});
MinWagesMaster.belongsTo(UserMaster, {
  as: 'deleteByUser',
  foreignKey: { name: 'deleteBy' },
});


module.exports = MinWagesMaster;
