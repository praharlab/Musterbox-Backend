const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CityMaster = require('./citymaster');
const { registrationStatus } = require('../utils/dbUtils');
const LeadMaster = sequelize.define('leadMaster', {
  leadMasterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  leadCompanyName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  leadCompanyAddress: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  contactPersonName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  contactPersonMobileNo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  contactPersonEmail: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  registrationStatus: {
    type: Sequelize.ENUM(...Object.values(registrationStatus)),
    allowNull: true,
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
});

LeadMaster.belongsTo(CityMaster, { foreignKey: { name: 'cityMasterID' } });

module.exports = LeadMaster;
