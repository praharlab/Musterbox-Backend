const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'product';
const CompanyMaster = require('./companyMaster');
const Product = sequelize.define(
  table_name,
  {
    productID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    productName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    productPhoto: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.BIGINT,
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
        fields: ['productName'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

Product.belongsTo(CompanyMaster, { foreignKey: { name: 'companyMasterID' } });
module.exports = Product;
