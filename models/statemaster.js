const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CountryMaster = require('./countrymaster');
const table_name = 'stateMaster';
const StateMaster = sequelize.define(table_name, {
  stateMasterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  stateName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  stateCode: {
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

StateMaster.belongsTo(CountryMaster, {
  foreignKey: { name: 'countryMasterID' },
});

module.exports = StateMaster;
