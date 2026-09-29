const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const UserMaster = require('./userMaster');
const table_name = 'quartertaxchallan';

const QuarterTaxChallan = sequelize.define(table_name, {
  QuarterTaxChallanID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  YearMonth: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  Quarters: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  TDSReceipt: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  EmpAmtCredited: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  EmpAmtTaxDeducted: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  EmpTaxDeposited: {
    type: Sequelize.DECIMAL,
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

QuarterTaxChallan.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
module.exports = QuarterTaxChallan;
