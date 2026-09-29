const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'mailConfiguration';
const companyMaster = require('./companyMaster');
const MailConfiguration = sequelize.define(table_name, {
  mailConfigurationID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  host: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  port: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

MailConfiguration.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = MailConfiguration;
