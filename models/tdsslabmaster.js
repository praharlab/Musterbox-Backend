const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const table_name = 'tdsslabmaster';

const TdsSlabMaster = sequelize.define(table_name, {
  TdsSlabMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  YearMonth: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  FromAmount: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  ToAmount: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  TdsRate: {
    type: Sequelize.BIGINT,
    allowNull: false,
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
  Status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

module.exports = TdsSlabMaster;
