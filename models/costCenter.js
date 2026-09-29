const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'costCenter';
const CostCenter = sequelize.define(
  table_name,
  {
    costCenterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    costCenterName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    costCenterCode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['costCenterName'],
      },
      {
        unique: false,
        fields: ['costCenterCode'],
      },
    ],
  }
);

module.exports = CostCenter;
