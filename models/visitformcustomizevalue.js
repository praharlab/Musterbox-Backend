const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'visitFormCustomizeValue';
const visitFormCustomize = require('./visitformcustomize');

const VisitFormCustomizeValue = sequelize.define(table_name, {
  visitFormCustomizeValueID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  visitFormCustomizeID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  visitID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  value: {
    type: Sequelize.STRING,
    allowNull: true,
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

VisitFormCustomizeValue.belongsTo(visitFormCustomize, {
  foreignKey: { name: 'visitFormCustomizeID' },
});
module.exports = VisitFormCustomizeValue;
