const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const GradeStructure = require('./gradeStructure');
const HRSalaryFields = require('./hrSalaryFields');
const { FormulaPreferenceEnum } = require('../utils/dbUtils');
const table_name = 'gradeSalaryStructure';
const GradeSalaryStructure = sequelize.define(
  table_name,
  {
    gradeSalaryStructureID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    gradeStructureID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    salaryFieldID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    fieldDefaultPer: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    fieldFixAmount: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    formula: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    formulaID: {
      type: Sequelize.STRING,
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
    salaryfieldindex: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    salaryfieldmaxrange: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    fieldFixAmount1: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },

    formula1: {
      type: Sequelize.STRING,
    },
    formulaPreference: {
      type: Sequelize.ENUM(...Object.values(FormulaPreferenceEnum)),
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['gradeStructureID'],
      },
      {
        unique: false,
        fields: ['salaryFieldID'],
      },
    ],
  }
);

GradeSalaryStructure.belongsTo(GradeStructure, {
  foreignKey: { name: 'gradeStructureID' },
});
GradeSalaryStructure.belongsTo(HRSalaryFields, {
  foreignKey: { name: 'salaryFieldID' },
});

GradeSalaryStructure.belongsTo(HRSalaryFields, {
  as: 'HSF',
  foreignKey: { name: 'salaryFieldID' },
});

GradeStructure.hasMany(GradeSalaryStructure, {
  foreignKey: { name: 'gradeStructureID' },
});

module.exports = GradeSalaryStructure;
