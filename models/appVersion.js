const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'appVersion';
const AppVersion = sequelize.define(table_name, {
  appVersionID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  deviceType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  appVersion: {
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
});

module.exports = AppVersion;
