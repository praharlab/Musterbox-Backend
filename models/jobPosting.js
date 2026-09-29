const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const Designation = require("./designation");
const companyMaster = require("./companyMaster");
const BranchMaster = require("./branchMaster");
const Department = require("./department");
const JobRoleClassification = require("./jobRoleClassification");
const table_name = "jobPosting";

const JobPosting = sequelize.define(
  table_name,
  {
    jobPostingID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    jobTitle: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    employmentType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    jobDescription: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    jobLocation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    requirements: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    lastApplicableDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    minSalary: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    maxSalary: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    noOfPosition: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    secretKey: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.INTEGER,
    },
    updateBy: {
      type: Sequelize.INTEGER,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  { paranoid: true }
);

JobPosting.addHook("beforeCreate", (jobPosting, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  jobPosting.createBy = options.user.userMasterId;
  jobPosting.updateBy = options.user.userMasterId;
  jobPosting.createByIp = options.user.userIpAddress;
  jobPosting.updateByIp = options.user.userIpAddress;
});

JobPosting.addHook("beforeUpdate", (jobPosting, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  jobPosting.updateBy = options.user.userMasterId;
  jobPosting.ipAddress = options.user.userIpAddress;
  jobPosting.updateByIp = options.user.userIpAddress;
});

JobPosting.addHook("beforeDestroy", (jobPosting, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  jobPosting.deleteBy = options.user.userMasterId;
  jobPosting.deleteByIp = options.user.userIpAddress;
});

JobPosting.belongsTo(companyMaster, {
  foreignKey: { name: "companyMasterID" },
});
JobPosting.belongsTo(BranchMaster, {
  foreignKey: { name: "branchMasterID" },
});
JobPosting.belongsTo(Department, {
  foreignKey: { name: "departmentId" },
});

JobPosting.belongsTo(Designation, {
  foreignKey: { name: "designationId" },
});
JobPosting.belongsTo(JobRoleClassification, {
  foreignKey: { name: "jobRoleClassificationID" },
});
module.exports = JobPosting;
