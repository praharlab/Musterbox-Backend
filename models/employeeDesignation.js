const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Designation = require('./designation');
const table_name = 'employeeDesignation';
const EmployeeDesignation = sequelize.define(
  table_name,
  {
    employeeDesignationID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    designationID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    applicableDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DATEONLY,
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
      {
        unique: false,
        fields: ['designationID'],
      },
    ],
  }
);

EmployeeDesignation.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeDesignation.belongsTo(Designation, {
  as: 'designation',
  foreignKey: { name: 'designationID' },
});
UserMaster.hasMany(EmployeeDesignation, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeDesignation.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

EmployeeDesignation.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

UserMaster.hasMany(EmployeeDesignation, {
  as: 'emp_desig',
  foreignKey: { name: 'userMasterID' },
});

module.exports = EmployeeDesignation;
