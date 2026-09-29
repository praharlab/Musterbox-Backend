const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const employeeJoiningDetails = require('./employeeJoiningDetails');
const employeeDepartment = require('./employeeDepartment');
const AttendanceCorrection = require('./attendanceCorrection');
const department = require('./department');
const designation = require('./designation');
const branch = require('./branchMaster');
const Shift = require('./shift');
const UserMaster = require('./userMaster');
const table_name = 'attendanceTransaction';

const attendanceTransaction = sequelize.define(
  table_name,
  {
    AttendanceTransID: {
      type: Sequelize.BIGINT,
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
      allowNull: true,
    },
    designationID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    branchID: {
      type: Sequelize.BIGINT,
      allowNull: true,
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
    Shift: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    Shifthrs: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ShiftIntime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ShiftoutTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    InHrs: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    OutHrs: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    LateBy: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    EarlyBy: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Panalty: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    PanaltyDeduction: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Othrs: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    fulldayhalfday: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    punchINbranch: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    punchOUTbranch: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    locationTypeIN: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    locationTypeOUT: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    goEarlyUsed: {
      type: Sequelize.INTEGER,
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
    goEarlyPanalty: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    goEarlyPanaltyDeduction: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latePenaltyMinutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    earlyPenaltyMinutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    lunchBreak: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    teaBreak: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    lunchBreakStartTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    lunchBreakEndTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    teaBreakInStartTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    teaBreakEndTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    roundOffMinutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    withoutOtMinutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    LCPenaltyFrom: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    EGPenaltyFrom: {
      type: Sequelize.STRING,
      allowNull: true,
    }
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

attendanceTransaction.belongsTo(userMaster, {
  foreignKey: { name: 'userMasterID' },
});
attendanceTransaction.belongsTo(department, {
  foreignKey: { name: 'departmentID' },
});
attendanceTransaction.belongsTo(designation, {
  foreignKey: { name: 'designationID' },
});
attendanceTransaction.belongsTo(branch, { foreignKey: { name: 'branchID' } });

attendanceTransaction.belongsTo(Shift, { foreignKey: { name: 'Shift' } });
UserMaster.hasMany(attendanceTransaction, {
  foreignKey: { name: 'userMasterID' },
});


module.exports = attendanceTransaction;
