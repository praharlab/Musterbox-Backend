const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const overTimePolicy = require('./overTimePolicy');
const table_name = 'userOverTimePolicyAssign';

const UserOverTimePolicyAssign = sequelize.define(table_name, {
  userOverTimePolicyAssignID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  overTimePolicyID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  startDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  createByIp: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

UserOverTimePolicyAssign.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
UserOverTimePolicyAssign.belongsTo(overTimePolicy, {
  foreignKey: { name: 'overTimePolicyID' },
});

module.exports = UserOverTimePolicyAssign;
