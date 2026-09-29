const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const table_name = 'resignation';
const ResignationReason = require('./resigantionReason');
const EmployeeResignation = sequelize.define(table_name, {
  resignationID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  employeeComment: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  appliedDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  lastworkingdate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  preferredLWDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  relievingDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  attachment: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  noticeperiod: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  authorizationstatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
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
});

EmployeeResignation.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeResignation.belongsTo(ResignationReason, {
  foreignKey: { name: 'resigantionReasonID' },
});
UserMaster.hasMany(EmployeeResignation, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
module.exports = EmployeeResignation;
