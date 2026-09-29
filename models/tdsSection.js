const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'tdsSection';

const tdsSection = sequelize.define(table_name, {
  tdsSectionID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  tdsSectionName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  tdsSectionDescription: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  deleteBy: {
    type: Sequelize.INTEGER,
  },
  deleteByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

tdsSection.addHook('beforeCreate', (tdsSection, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  tdsSection.createBy = options.user.userMasterId;
  tdsSection.createByIp = options.user.userIpAddress;
});

tdsSection.addHook('beforeUpdate', (tdsSection, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  tdsSection.updateBy = options.user.userMasterId;
  tdsSection.updateByIp = options.user.userIpAddress;
});

tdsSection.addHook('beforeDestroy', (tdsSection, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  tdsSection.deleteBy = options.user.userMasterId;
  tdsSection.deleteByIp = options.user.userIpAddress;
});

module.exports = tdsSection;
