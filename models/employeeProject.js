const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const UserMaster = require("./userMaster");
const Project = require("./project");
const table_name = "employeeProject";

const EmployeeProject = sequelize.define(
  table_name,
  {
    employeeProjectID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    releaseDate: {
      type: Sequelize.DATEONLY,
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
  {
    paranoid: true,
  }
);

EmployeeProject.addHook("beforeCreate", (employeeProject, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  employeeProject.createBy = options.user.userMasterId;
  employeeProject.createByIp = options.user.userIpAddress;
});
EmployeeProject.addHook("beforeBulkCreate", (employeeProject, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  employeeProject.forEach((answer) => {
    answer.createBy = options.user.userMasterId;
    answer.createByIp = options.user.userIpAddress;
  });
});
EmployeeProject.addHook("beforeUpdate", (employeeProject, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  employeeProject.updateBy = options.user.userMasterId;
  employeeProject.updateByIp = options.user.userIpAddress;
});

EmployeeProject.addHook("beforeDestroy", (employeeProject, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  employeeProject.deleteBy = options.user.userMasterId;
  employeeProject.deleteByIp = options.user.userIpAddress;
});

EmployeeProject.belongsTo(UserMaster, {
  foreignKey: { name: "userMasterID" },
});

EmployeeProject.belongsTo(Project, {
  foreignKey: { name: "projectID" },
});

UserMaster.hasMany(EmployeeProject, {
  foreignKey: { name: "userMasterID" },
});

EmployeeProject.belongsTo(UserMaster, {
  as: "createdByUserDetails",
  foreignKey: { name: "createBy" },
});

EmployeeProject.belongsTo(UserMaster, {
  as: "updatedByUserDetails",
  foreignKey: { name: "updateBy" },
});

EmployeeProject.belongsTo(UserMaster, {
  as: "deleteByUserDetails",
  foreignKey: { name: "deleteBy" },
});

module.exports = EmployeeProject;
