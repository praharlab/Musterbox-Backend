const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Department = require('./department');
const table_name = 'employeeDepartment';
const EmployeeDepartment = sequelize.define(
  table_name,
  {
    employeeDepartmentID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    departmentID: {
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
        fields: ['departmentID'],
      },
    ],
  }
);

EmployeeDepartment.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeDepartment.belongsTo(Department, {
  as: 'department',
  foreignKey: { name: 'departmentID' },
});
EmployeeDepartment.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});
EmployeeDepartment.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
UserMaster.hasMany(EmployeeDepartment, {
  as:'emp_dept',
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(EmployeeDepartment, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = EmployeeDepartment;
