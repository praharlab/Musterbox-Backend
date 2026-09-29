const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'hrSalaryFieldChild';
const HRSalaryFields = require('./hrSalaryFields');
const HRSalaryFieldChild = sequelize.define(
  table_name,
  {
    salaryFieldChildID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    salaryFieldID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    salaryFieldsEffect: {
      type: Sequelize.INTEGER,
      allowNull: false,
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
  {
    indexes: [
      {
        unique: false,
        fields: ['salaryFieldID'],
      },
    ],
  }
);

HRSalaryFieldChild.belongsTo(HRSalaryFields, {
  foreignKey: { name: 'salaryFieldsEffect' },
});
module.exports = HRSalaryFieldChild;
