const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const table_name = 'taxchallanmaster';

const TaxChallanMaster = sequelize.define(table_name, {
  TaxChallanMasterID: {
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
  SrNo: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  TaxDepositedAmt: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  BSRCode: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  TaxDepositedDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  ChallanSerialNo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Oltas: {
    type: Sequelize.STRING,
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

TaxChallanMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
module.exports = TaxChallanMaster;
