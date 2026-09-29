const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Employeement = require('./employeement');
const table_name = 'employeeEmployeement';
const EmployeeEmployeement = sequelize.define(
  table_name,
  {
    employeeEmployeementId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    employeement: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    applicableDate: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DATE,
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['applicableDate'],
      },
      {
        unique: false,
        fields: ['endDate'],
      },
    ],
  }
);

EmployeeEmployeement.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(EmployeeEmployeement, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = EmployeeEmployeement;
