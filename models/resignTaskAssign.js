const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const usermaster = require('./userMaster');
const ResignationTask = require('./resignTask');
const UserResignation = require('./resignation');

const table_name = 'resignTaskAssign';
const ResignationTaskAssign = sequelize.define(table_name, {
  resignTaskAssignID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  resignTaskID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  resignationID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  remarks: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  isApplicable: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  isRecovered: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  amount: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
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

ResignationTaskAssign.belongsTo(usermaster, {
  foreignKey: { name: 'userMasterID' },
});
ResignationTaskAssign.belongsTo(UserResignation, {
  foreignKey: { name: 'resignationID' },
});
ResignationTaskAssign.belongsTo(ResignationTask, {
  foreignKey: { name: 'resignTaskID' },
});

module.exports = ResignationTaskAssign;
