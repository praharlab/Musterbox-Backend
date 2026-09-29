const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Form16 = require('./form16');
const table_name = 'form16child';

const Form16child = sequelize.define(table_name, {
  Form16ChildID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  //foreign key
  Form16ID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  GrossAmount: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  QualifyingAmount: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  StartDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  EndDate: {
    type: Sequelize.DATE,
    allowNull: true,
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
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

Form16child.belongsTo(Form16, { foreignKey: { name: 'Form16ID' } });
module.exports = Form16child;
