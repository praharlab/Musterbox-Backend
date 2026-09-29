const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const LateEarlyPolicy = require('./lateEarlyPolicy');
const table_name = 'employeeLateEarlyPolicy';
const EmployeeLateEarlyPolicy = sequelize.define(table_name, {
  employeeLateEarlyPolicyID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
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

EmployeeLateEarlyPolicy.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeLateEarlyPolicy.belongsTo(LateEarlyPolicy, {
  as: 'lateEarlyPolicy',
  foreignKey: { name: 'lateEarlyPolicyMasterID' },
});
UserMaster.hasMany(EmployeeLateEarlyPolicy, {
  foreignKey: { name: 'userMasterID' },
});


EmployeeLateEarlyPolicy.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' }
});


EmployeeLateEarlyPolicy.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' }
});

module.exports = EmployeeLateEarlyPolicy;
