const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'attendancePolicy';
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const { attendanceBranchTypeRule } = require('../utils/dbUtils');
const AttendancePolicy = sequelize.define(table_name, {
  attendancePolicyID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  attendancePolicyName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  selfieAttendance: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  outsidePunchInPunchOut: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  singleMultiplePunchInPunchOut: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  automaticAssignShift: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  sandwichLeave: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  BeforeAfterLeave: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  weekoffsandwichLeave: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  holidaysandwichLeave: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  HFDBeforeAfterLeave: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  considerWorkingHours: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  considerOvertimeAfter: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  overtimeEntryAfterMin: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  attendanceInMobile: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  coff: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  coffhalfday: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  cofffullday: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  coffOneAndHalfDay: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  coffTwoFullDay: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  giveOTAs: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  halfdayCoffEday: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  fulldayCoffEday: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  oneAndHalfDayCoffEday: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  twoDayCoffEday: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  overtimeHrs: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  showinsalaryslip: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  consider: {
    type: Sequelize.STRING,
    allowNull: true,
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

  pfApplicable: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  esicApplicable: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  missPunchMinutes: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  selfieWithFaceDetection: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  autoApprove: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },

  payType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  payAmount: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  skipMinutesInOvertime: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },

  overtimeType: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'actual',
  },
  typeValue: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  monthDays: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  toShowOT: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  payheadMasterId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  employeeESICPer: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  employerESICPer: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  preShiftHrsConsideration: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  showShift: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  extraOt: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  min_extra_ot_mins: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  extra_ot_mins: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  WHPHPriority: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  setCorrLimit: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  attCorrLimit: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  attBrType: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: attendanceBranchTypeRule.ALL,
  },
  attBranch: {
    type: Sequelize.ARRAY(Sequelize.BIGINT),
    allowNull: true,
  },
  preShiftMin: {
    // Minimum Minutes For PreShiftHrs Consideration
    type: Sequelize.INTEGER,
    allowNull: true,
  },
});

AttendancePolicy.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

AttendancePolicy.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

AttendancePolicy.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
// AttendancePolicy.sync({ alter: true })
module.exports = AttendancePolicy;
