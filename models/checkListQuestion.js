const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CheckList = require('./checklist');
const table_name = 'checklistQuestion';
const CheckListQuestion = sequelize.define(table_name, {
  checkListQuestionID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  checkListQuestion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  checkListID: {
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
});

CheckListQuestion.belongsTo(CheckList, { foreignKey: { name: 'checkListID' } });

module.exports = CheckListQuestion;
