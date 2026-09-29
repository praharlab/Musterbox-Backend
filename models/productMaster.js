const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'productMaster';
const ProductMaster = sequelize.define(
  table_name,
  {
    productMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    productName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    productCode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    totalUser: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    totalTracking: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    productPrice: {
      type: Sequelize.INTEGER,
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['productName'],
      },
      {
        unique: false,
        fields: ['productCode'],
      },
      {
        unique: false,
        fields: ['productPrice'],
      },
    ],
  }
);

module.exports = ProductMaster;
