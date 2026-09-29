const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'companySubscription';
const ProductMaster = require('./productMaster');
const CompanyMaster = require('./companyMaster');
const CompanySubscriptionMaster = sequelize.define(
  table_name,
  {
    companyPlanMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    productMasterID: {
      type: Sequelize.INTEGER,
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
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DATEONLY,
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
        fields: ['companyMasterID'],
      },
      {
        unique: false,
        fields: ['productMasterID'],
      },
    ],
  }
);

CompanySubscriptionMaster.belongsTo(ProductMaster, {
  foreignKey: { name: 'productMasterID' },
});
CompanySubscriptionMaster.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
CompanyMaster.hasMany(CompanySubscriptionMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = CompanySubscriptionMaster;
