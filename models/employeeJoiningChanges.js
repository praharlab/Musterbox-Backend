const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const bankMaster = require('./bankMaster');
const table_name = 'employeeJoiningDetailsChanges';
const EmployeeJoiningDetailsChanges = sequelize.define(table_name, {
  employeeJoiningDetailChangesId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  employeeCode: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  AccountMasterId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  dob: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  joiningDate: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  leavingDate: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  adharCard: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  esicNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  pfNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  uanNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  pancard: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  bankMasterID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  bankIFSC: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  bankAccountNo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  retirementAge: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  retirementDate: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  noticePeriod: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  applicableDate: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  endDate: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  salarytype: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  biometricCode: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  biometricSerialNo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  salaryCalculationAct: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  employment: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  overtime: {
    type: Sequelize.INTEGER,
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
  esicEndMonth: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  adharName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  adharPhoto: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  panPhoto: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  pfjoiningDate: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  pfbankMasterID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  pfbankIFSC: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  pfbankAccountNo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  esicjoiningDate: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  bloodgroup: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  nationality: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  nameAsBank: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

EmployeeJoiningDetailsChanges.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeJoiningDetailsChanges.belongsTo(bankMaster, {
  foreignKey: { name: 'bankMasterID' },
});

module.exports = EmployeeJoiningDetailsChanges;
