const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const SalaryPolicy = require('./salaryPolicy');
const table_name = 'employeeSalaryPolicy';
const EmployeeSalaryPolicy = sequelize.define(table_name, {
  employeeSalaryPolicyID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  salaryPolicyID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  startDate: {
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
});

EmployeeSalaryPolicy.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeSalaryPolicy.belongsTo(SalaryPolicy, {
  as: 'salaryPolicy',
  foreignKey: { name: 'salaryPolicyID' },
});
UserMaster.hasMany(EmployeeSalaryPolicy, {
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(EmployeeSalaryPolicy, {
  as:'empSalPolicy',
  foreignKey: { name: 'userMasterID' },
});

EmployeeSalaryPolicy.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: {name: 'createBy'},
});


EmployeeSalaryPolicy.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: {name: 'updateBy'},
});


module.exports = EmployeeSalaryPolicy;
