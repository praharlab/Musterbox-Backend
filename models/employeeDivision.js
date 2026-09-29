const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Division = require('./division');

const EmployeeDivision = sequelize.define(
  'employeeDivision',
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

EmployeeDivision.addHook('beforeCreate', (employeeDivision, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  employeeDivision.createBy = options.user.userMasterId;
  employeeDivision.updateBy = options.user.userMasterId;
  employeeDivision.createByIp = options.user.userIpAddress;
  employeeDivision.updateByIp = options.user.userIpAddress;
});

EmployeeDivision.addHook('beforeUpdate', (employeeDivision, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  employeeDivision.updateBy = options.user.userMasterId;
  employeeDivision.ipAddress = options.user.userIpAddress;
  employeeDivision.updateByIp = options.user.userIpAddress;
});

EmployeeDivision.addHook('beforeDestroy', (employeeDivision, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  employeeDivision.deleteBy = options.user.userMasterId;
  employeeDivision.deleteByIp = options.user.userIpAddress;
});

EmployeeDivision.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeDivision.belongsTo(Division, {
  foreignKey: { name: 'divisionId' },
});
UserMaster.hasMany(EmployeeDivision, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeDivision.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

EmployeeDivision.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
EmployeeDivision.belongsTo(UserMaster, {
  as: 'deleteByUserDetails',
  foreignKey: { name: 'deleteBy' },
});

module.exports = EmployeeDivision;
