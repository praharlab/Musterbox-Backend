const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Designation = require('./designation');
const companyMaster = require('./companyMaster');
const BranchMaster = require('./branchMaster');
const Department = require('./department');
const JobPosting = require('./jobPosting');
const PreboardingMaster = require('./preboardingMaster');
const CountryMaster = require('./countrymaster');
const UserMaster = require('./userMaster');
const table_name = 'jobApplication';

const JobApplication = sequelize.define(
  table_name,
  {
    jobApplicationID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    middleName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    userNumber: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    jobApplicationStatus: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      // 0 --> Rejected
      // 1 --> Applied
      // 2 --> Accepted
    },
    interViewType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    interViewDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    interViewTime: {
      type: Sequelize.TIME,
      allowNull: true,
    },
    interViewLink: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    acceptRemarks: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    rejectionRemarks: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    resumeAttachment: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    candidateComment: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    branchMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    interViewBranchMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    preboardingMasterID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    userNumberCountryMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
    },
    updateBy: {
      type: Sequelize.BIGINT,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    employeeType: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'national',
    },
    nationality: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true }
);

JobApplication.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

JobApplication.belongsTo(BranchMaster, {
  foreignKey: { name: 'branchMasterID' },
});
JobApplication.belongsTo(BranchMaster, {
  foreignKey: { name: 'interViewBranchMasterID' },
  as: 'interviewBranch',
});
JobApplication.belongsTo(Department, {
  foreignKey: { name: 'departmentId' },
});

JobApplication.belongsTo(Designation, {
  foreignKey: { name: 'designationId' },
});

JobApplication.belongsTo(JobPosting, {
  foreignKey: { name: 'jobPostingID' },
});

JobApplication.belongsTo(PreboardingMaster, {
  foreignKey: { name: 'preboardingMasterID' },
});
JobApplication.belongsTo(CountryMaster, {
  foreignKey: { name: 'userNumberCountryMasterID' },
});

JobApplication.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

JobApplication.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
module.exports = JobApplication;
