const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Department = require('./department');
const AssetCategory = require('./assetCategory');
const AssetMaster = require('./assetMaster');
const table_name = 'assignAssetToEmployee';
const AssignAssetToEmployee = sequelize.define(
  table_name,
  {
    assignAssetToEmployeeID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    assetCategoryID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    assetMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    assetImages: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    },
    assignDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    returnDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    quantity: {
      type: Sequelize.INTEGER,
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['assetCategoryID'],
      },
      {
        unique: false,
        fields: ['assetMasterID'],
      },
      {
        unique: false,
        fields: ['assignDate'],
      },
      {
        unique: false,
        fields: ['returnDate'],
      },
    ],
  }
);

AssignAssetToEmployee.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
AssignAssetToEmployee.belongsTo(AssetCategory, {
  as: 'assetCategory',
  foreignKey: { name: 'assetCategoryID' },
});
AssignAssetToEmployee.belongsTo(AssetMaster, {
  as: 'assetMaster',
  foreignKey: { name: 'assetMasterID' },
});

module.exports = AssignAssetToEmployee;
