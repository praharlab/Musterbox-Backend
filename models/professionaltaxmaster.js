/** @format */

const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const StateMaster = require('./statemaster');
const table_name = 'professionalTaxSlabMaster';
const { PTCalculationEnum } = require('../utils/dbUtils');
const Corporation = require('./corporation');

const ProfessionalTaxSlabMaster = sequelize.define(
  table_name,
  {
    professionalTaxID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    fromAmount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    toAmount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    maleTax: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    femaleTax: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    month: {
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
    applicableFromYYYYMM: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ptCalculation: {
      type: Sequelize.ENUM(...Object.values(PTCalculationEnum)),
      allowNull: false,
      defaultValue: PTCalculationEnum.MONTHLY,
    },
    corporationId: {
      type: Sequelize.INTEGER,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['fromAmount'],
      },
      {
        unique: false,
        fields: ['toAmount'],
      },
      {
        unique: false,
        fields: ['stateMasterID'],
      },
    ],
  }
);

ProfessionalTaxSlabMaster.belongsTo(StateMaster, {
  foreignKey: { name: 'stateMasterID' },
});

ProfessionalTaxSlabMaster.belongsTo(Corporation, {
  foreignKey: { name: 'corporationId' },
});

module.exports = ProfessionalTaxSlabMaster;
