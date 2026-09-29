const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const WorkingArea = require('./workingArea');

const EmployeeWorkingArea = sequelize.define(
  'employeeWorkingArea',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    endDate: {
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

EmployeeWorkingArea.addHook('beforeCreate', (employeeWorkingArea, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  employeeWorkingArea.createBy = options.user.userMasterId;
  employeeWorkingArea.updateBy = options.user.userMasterId;
  employeeWorkingArea.createByIp = options.user.userIpAddress;
  employeeWorkingArea.updateByIp = options.user.userIpAddress;
});

EmployeeWorkingArea.addHook('beforeUpdate', (employeeWorkingArea, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  employeeWorkingArea.updateBy = options.user.userMasterId;
  employeeWorkingArea.ipAddress = options.user.userIpAddress;
  employeeWorkingArea.updateByIp = options.user.userIpAddress;
});

EmployeeWorkingArea.addHook('beforeDestroy', (employeeWorkingArea, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  employeeWorkingArea.deleteBy = options.user.userMasterId;
  employeeWorkingArea.deleteByIp = options.user.userIpAddress;
});

EmployeeWorkingArea.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeWorkingArea.belongsTo(WorkingArea, {
  foreignKey: { name: 'workingAreaId' },
});
UserMaster.hasMany(EmployeeWorkingArea, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeWorkingArea.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

EmployeeWorkingArea.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
EmployeeWorkingArea.belongsTo(UserMaster, {
  as: 'deleteByUserDetails',
  foreignKey: { name: 'deleteBy' },
});
module.exports = EmployeeWorkingArea;
