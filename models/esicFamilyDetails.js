const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const EmployeeJoiningRequest = require('./employeeJoiningRequest');
const table_name = 'esicFamilyDetails';

const EsicFamilyDetails = sequelize.define(
  table_name,
  {
    esicFamilyDetailsID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    familyMemberName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    dob: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    relation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    gender: {
      type: Sequelize.STRING,
      allowNull: true,
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
    deleteBy: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true,
  }
);

EsicFamilyDetails.belongsTo(EmployeeJoiningRequest, {
  foreignKey: { name: 'employeeJoiningRequestID' },
});

EmployeeJoiningRequest.hasMany(EsicFamilyDetails, {
  foreignKey: { name: 'employeeJoiningRequestID' },
});

module.exports = EsicFamilyDetails;
