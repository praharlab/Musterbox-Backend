const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Designation = require('./designation');
const table_name = 'checklist';
const CheckList = sequelize.define(table_name, {
  checkListID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  checkListName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  pastdays: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  designationId: {
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

CheckList.belongsTo(Designation, { foreignKey: { name: 'designationId' } });

module.exports = CheckList;
