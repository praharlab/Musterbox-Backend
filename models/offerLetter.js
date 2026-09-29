const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const table_name = 'offerLetter';

const OfferLetter = sequelize.define(table_name, {
  offerLetterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  offerLetterName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  letterTemplate: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  letterHead: {
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
});

OfferLetter.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = OfferLetter;
