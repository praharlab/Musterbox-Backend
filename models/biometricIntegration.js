const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'biometric_integration';
const CompanyMaster = require('./companyMaster');
const Biometric_Integration = sequelize.define(table_name, {
  biometricIntegrationID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  biometricSerialNo: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
  },
  status: {
    type: Sequelize.BIGINT,
    allowNull: false,
    defaultValue: 1,
  },
  algorithm: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
  },
  database: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
  },
  table: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
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
  direction: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
  integrationType: {
    //AIFaceAttendance, IpBasedBiometric, parallelDatabase
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
  serverIp: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
});

Biometric_Integration.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
module.exports = Biometric_Integration;
