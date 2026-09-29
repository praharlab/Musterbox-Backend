const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CityMaster = require('./citymaster');
const table_name = 'customer';
const CompanyMaster = require('./companyMaster');
const Customer = sequelize.define(
  table_name,
  {
    customerID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    companyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    customerName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    currentLocation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    mobileNumber1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    mobileNumber2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    website: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latitude: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    longitude: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    zipcode: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    cityMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
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
        fields: ['companyName'],
      },
      {
        unique: false,
        fields: ['customerName'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

Customer.belongsTo(CompanyMaster, { foreignKey: { name: 'companyMasterID' } });
Customer.belongsTo(CityMaster, { foreignKey: { name: 'cityMasterID' } });
module.exports = Customer;
