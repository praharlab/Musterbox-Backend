/** @format */

const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const table_name = 'hrSalarySlip';
const HRSalarySlip = sequelize.define(
  table_name,
  {
    hrSalarySlipID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    salaryYYYYMM: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    path: {
      type: Sequelize.TEXT,
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
    salarySlipIssue: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    paid: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue:false
    },
    paidDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['salaryYYYYMM'],
      },
      {
        unique: false,
        fields: ['salaryYYYYMM', 'salarySlipIssue'],
      },
    ],
  }
);

HRSalarySlip.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });
userMaster.hasMany(HRSalarySlip, { foreignKey: { name: 'userMasterID' } });

module.exports = HRSalarySlip;
