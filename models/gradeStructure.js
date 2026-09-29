const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const { SkillCategoryType } = require('../utils/dbUtils');
const Contractor = require('./contractor');
const table_name = 'gradeStructure';
const GradeStructure = sequelize.define(
  table_name,
  {
    gradeStructureID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    gradeName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    baseOnCalculation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    gradeFrom: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    gradeTo: {
      type: Sequelize.INTEGER,
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
    isContractorGrade: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    contractorId: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    skillCategory: {
      type: Sequelize.ENUM(...Object.values(SkillCategoryType)),
    },
    applicableYYYYMM: {
      type: Sequelize.INTEGER,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['gradeName'],
      },
      {
        unique: false,
        fields: ['gradeFrom'],
      },
      {
        unique: false,
        fields: ['gradeTo'],
      },
      {
        unique: false,
        fields: ['baseOnCalculation'],
      },
    ],
  }
);
GradeStructure.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

GradeStructure.belongsTo(Contractor, {
  foreignKey: { name: 'contractorId' },
});



module.exports = GradeStructure;
