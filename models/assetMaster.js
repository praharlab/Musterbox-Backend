const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const assetCategory = require('./assetCategory');
const table_name = 'assetMaster';
const assetMaster = sequelize.define(
  table_name,
  {
    assetMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    assetSerialNo: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    assetName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    assetCategoryID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    purchaseDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    assetDocument: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyMasterID: {
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
        fields: ['assetMasterID'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

assetMaster.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
assetMaster.belongsTo(assetCategory, {
  foreignKey: { name: 'assetCategoryID' },
});

module.exports = assetMaster;
