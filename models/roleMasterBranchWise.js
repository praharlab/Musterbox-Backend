const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const RoleMaster = require('./roleMaster');
const BranchMaster = require('./branchMaster');
const table_name = 'roleMasterBranchWise';

const RoleMasterBranchWise = sequelize.define(table_name, {
  roleMasterBranchWiseID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
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

RoleMasterBranchWise.belongsTo(RoleMaster, {
  foreignKey: { name: 'roleMasterID' },
});

RoleMasterBranchWise.belongsTo(BranchMaster, {
  foreignKey: { name: 'branchMasterID' },
});

RoleMaster.hasMany(RoleMasterBranchWise, {
  foreignKey: { name: 'roleMasterID' },
});

module.exports = RoleMasterBranchWise;
