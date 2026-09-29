const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const table_name = 'salaryIncrement';
const Increment = sequelize.define(table_name, {
  salaryIncrementID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  incrementGrossPercentage: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  incrementGrossAmount: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  incrementStartYearMonth: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  authorizationStatus: {
    type: Sequelize.BIGINT,
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

Increment.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = Increment;
