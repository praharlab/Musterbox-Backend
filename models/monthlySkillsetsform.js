const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const SkillsetsForm = require('./skillsetsform');

const tableName = 'monthlySkillsetsform';
const MonthlySkillsetsform = sequelize.define(tableName, {
  monthlySkillsetsFormID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  YYYYMM: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  fillStatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  questionSkillsets: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
  answerSkillsets: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
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
  companyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  skillsetsFormID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  verified: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  reportto: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  fillby: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  fillDateTime: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  verifiedby: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  verifiedDateTime: {
    type: Sequelize.DATE,
    allowNull: true,
  },
});

// SkillsetsForm.belongsTo(SkillSets, { foreignKey: { name: "skillSetID" } });
MonthlySkillsetsform.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
MonthlySkillsetsform.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
MonthlySkillsetsform.belongsTo(SkillsetsForm, {
  foreignKey: { name: 'skillsetsFormID' },
});

module.exports = MonthlySkillsetsform;
