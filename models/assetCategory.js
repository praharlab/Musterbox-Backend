const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'assetCategory';
const AssetCategory = sequelize.define(
  table_name,
  {
    assetCategoryID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    assetCategory: {
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
        fields: ['assetCategory'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

AssetCategory.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = AssetCategory;
