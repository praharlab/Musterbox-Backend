const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'skillsetsform';
const SkillSets = require('../models/skillsets');
const Designation = require('./designation');
const CompanyMaster = require('./companyMaster');

const SkillsetsForm = sequelize.define(table_name, {
  skillsetsFormID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  skillSetsID: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
  },
  companyMasterId: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  designationID: {
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
    allowNull: true,
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

// SkillsetsForm.belongsTo(SkillSets, { foreignKey: { name: "skillSetID" } });
SkillsetsForm.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterId' },
});
SkillsetsForm.belongsTo(Designation, {
  foreignKey: { name: 'designationID' },
});

module.exports = SkillsetsForm;
