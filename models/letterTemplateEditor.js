const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'letterTemplateEditor';
const CompanyMaster = require('./companyMaster');
const LetterTemplateType = require('./letterTemplateType');
const letterTemplateEditor = sequelize.define(
  table_name,
  {
    letterTemplateID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
      //forign key
    },
    letterTypeID: {
      type: Sequelize.INTEGER,
      allowNull: false,
      //forign key
    },
    letter: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    path: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    letterhead: {
      type: Sequelize.STRING,
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
  },
  {}
);

letterTemplateEditor.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
letterTemplateEditor.belongsTo(LetterTemplateType, {
  foreignKey: { name: 'letterTypeID' },
});

module.exports = letterTemplateEditor;
