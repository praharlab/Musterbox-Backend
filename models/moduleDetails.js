const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const ModuleList = require('./moduleList');
const table_name = 'ModuleDetails';
const ModuleDetails = sequelize.define(table_name, {
  moduleDetailsID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  moduleId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    //forign key
  },
  FAQs: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Description: {
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

ModuleDetails.belongsTo(ModuleList, { foreignKey: { name: 'moduleId' } });

module.exports = ModuleDetails;
