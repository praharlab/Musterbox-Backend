const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'AuthorizationCriteriaMaster';
const AuthorizationCriteriaMaster = sequelize.define(table_name, {
  AuthorizationCriteriaID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  AuthorizationCriteria: {
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

module.exports = AuthorizationCriteriaMaster;
