const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const usermaster = require('./userMaster');
const UserResignation = require('./resignation');

const table_name = 'resignationAuthorization';
const ResignationAuthorizationRequest = sequelize.define(table_name, {
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
});

ResignationAuthorizationRequest.belongsTo(usermaster, {
  foreignKey: { name: 'createBy' },
});
ResignationAuthorizationRequest.belongsTo(UserResignation, {
  foreignKey: { name: 'ReferenceID' },
});

UserResignation.hasMany(ResignationAuthorizationRequest, {
  foreignKey: { name: 'ReferenceID' },
});
module.exports = ResignationAuthorizationRequest;
