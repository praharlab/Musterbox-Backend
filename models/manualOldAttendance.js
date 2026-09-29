const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const employeeJoiningDetails = require('./employeeJoiningDetails');
const employeeDepartment = require('./employeeDepartment');
const department = require('./department');
const designation = require('./designation');
const branch = require('./branchMaster');
const attendanceTransaction = require('./attendanceTransaction');
const table_name = 'manualOldAttendance';

const manualOldAttendance = sequelize.define(
  table_name,
  {
    ManualOldAttendanceID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    AttendanceTransID: {
      type: Sequelize.BIGINT,

      allowNull: false,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    InDatetime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    OutDateTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    AttendanceDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    fulldayhalfday: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    updateBy: {
      type: Sequelize.BIGINT,
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
        fields: ['AttendanceDate'],
      },
    ],
  }
);

manualOldAttendance.belongsTo(userMaster, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = manualOldAttendance;
