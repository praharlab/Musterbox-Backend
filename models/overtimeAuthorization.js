const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const usermaster = require('./userMaster');
const table_name = 'overtimeAuthorization';
const overTimeCalculation = require('./overTimeCalculation');
const overtimeAuthorizationRequest = sequelize.define(table_name, {
  AuthorizationRequestId: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  ReferenceID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  authstatus: {
    type: Sequelize.INTEGER,
    allowNull: true, // 1=> Accept 2=> Pending 0=> Reject
  },
  remarks: {
    type: Sequelize.TEXT,
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
  viewstatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

overtimeAuthorizationRequest.belongsTo(usermaster, {
  foreignKey: { name: 'createBy' },
});

overtimeAuthorizationRequest.belongsTo(overTimeCalculation, {
  as: 'overTimeCalculation',
  foreignKey: { name: 'ReferenceID' },
});

overtimeAuthorizationRequest.belongsTo(usermaster, {
  as: 'authorizedPerson',
  foreignKey: { name: 'userMasterID' },
});

module.exports = overtimeAuthorizationRequest;
