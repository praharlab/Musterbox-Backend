const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const bankMaster = require('./bankMaster');
const BankBranch = require('./bankBranch');
const Contractor = require('./contractor');
const { PayrollFrequencyType } = require('../utils/dbUtils');

const tableName = 'employeeJoiningDetails';
const EmployeeJoiningDetails = sequelize.define(
  tableName,
  {
    employeeJoiningDetailId: {
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
    bankBranchID: {
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
      type: Sequelize.TEXT,
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
    attendanceFrom: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    fullMonthPresence: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    nameAsBank: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    employeeType: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'national',
    },
    contractorId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    payrollFrequency: {
      type: Sequelize.ENUM(...Object.values(PayrollFrequencyType)),
      allowNull: false,
      defaultValue: PayrollFrequencyType.MONTHLY,
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
        fields: ['employeeJoiningDetailId'],
      },
    ],
  }
);

EmployeeJoiningDetails.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeJoiningDetails.belongsTo(bankMaster, {
  // as: 'employeeBank',
  foreignKey: { name: 'bankMasterID' },
});
EmployeeJoiningDetails.belongsTo(bankMaster, {
  as: 'employeePFBank',
  foreignKey: { name: 'pfbankMasterID' },
});
UserMaster.hasMany(EmployeeJoiningDetails, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeJoiningDetails.belongsTo(BankBranch, {
  // as: 'employeeBank',
  foreignKey: { name: 'bankBranchID' },
});

EmployeeJoiningDetails.belongsTo(Contractor, {
  foreignKey: { name: 'contractorId' },
});

module.exports = EmployeeJoiningDetails;
