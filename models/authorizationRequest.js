const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const formmaster = require('./formMaster');
const usermaster = require('./userMaster');
const usermasters = require('./userMaster');
const table_name = 'AuthorizationRequest';
const FormAuthorizationRequest = sequelize.define(table_name, {
  AuthorizationRequestId: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  formMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  TableName: {
    type: Sequelize.STRING,
    allowNull: false,
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

FormAuthorizationRequest.belongsTo(formmaster, {
  foreignKey: { name: 'formMasterID' },
});
FormAuthorizationRequest.belongsTo(usermaster, {
  foreignKey: { name: 'createBy' },
});

module.exports = FormAuthorizationRequest;
