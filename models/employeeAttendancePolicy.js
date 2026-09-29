const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const AttendancePolicy = require('./attendancePolicy');
const table_name = 'employeeAttendancePolicy';
const EmployeeAttendancePolicy = sequelize.define(table_name, {
  employeeAttendancePolicyID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  attendancePolicyID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  startDate: {
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
}, {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
    ],
  });

EmployeeAttendancePolicy.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeAttendancePolicy.belongsTo(AttendancePolicy, {
  as: 'attendancePolicy',
  foreignKey: { name: 'attendancePolicyID' },
});
UserMaster.hasMany(EmployeeAttendancePolicy, {
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(EmployeeAttendancePolicy, {
  as:'empAttPolicy',
  foreignKey: { name: 'userMasterID' },
});

EmployeeAttendancePolicy.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});
EmployeeAttendancePolicy.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

module.exports = EmployeeAttendancePolicy;
