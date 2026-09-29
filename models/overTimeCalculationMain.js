const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const table_name = 'OverTimeCalculationMain';

const overTimeCalculationMain = sequelize.define(table_name, {
  overTimeCalculationMainID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  //foreign key
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  yyyymm: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  overtimehrs: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  ratio: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },

  grossamount: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  dailyrate: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  TotalAmount: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
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
  rateBy: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  ReferenceId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  tableName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

overTimeCalculationMain.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(overTimeCalculationMain, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = overTimeCalculationMain;
