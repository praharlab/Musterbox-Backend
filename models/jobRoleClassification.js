const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const CompanyMaster = require("./companyMaster");

const table_name = "jobRoleClassification";

const JobRoleClassification = sequelize.define(
  table_name,
  {
    jobRoleClassificationID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    jobRoleClassificationName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    jobRoleClassificationDescription: {
      type: Sequelize.TEXT,
      allowNull: true,
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

JobRoleClassification.addHook(
  "beforeCreate",
  (jobRoleClassification, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    jobRoleClassification.createBy = options.user.userMasterId;
    jobRoleClassification.updateBy = options.user.userMasterId;
    jobRoleClassification.createByIp = options.user.userIpAddress;
    jobRoleClassification.updateByIp = options.user.userIpAddress;
  }
);

JobRoleClassification.addHook(
  "beforeUpdate",
  (jobRoleClassification, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    jobRoleClassification.updateBy = options.user.userMasterId;
    jobRoleClassification.ipAddress = options.user.userIpAddress;
    jobRoleClassification.updateByIp = options.user.userIpAddress;
  }
);

JobRoleClassification.addHook(
  "beforeDestroy",
  (jobRoleClassification, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    jobRoleClassification.deleteBy = options.user.userMasterId;
    jobRoleClassification.deleteByIp = options.user.userIpAddress;
  }
);

JobRoleClassification.belongsTo(CompanyMaster, {
  foreignKey: { name: "companyMasterID" },
});

module.exports = JobRoleClassification;
