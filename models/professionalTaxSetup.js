const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'professionalTaxSetup';
const ProfessionalTaxSetup = sequelize.define(table_name, {
  professionalTaxSetupID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  ptStatus: {
    type: Sequelize.BOOLEAN,
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

ProfessionalTaxSetup.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = ProfessionalTaxSetup;
