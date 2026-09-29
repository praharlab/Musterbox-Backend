const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const usermaster = require('./userMaster');
const table_name = 'attendanceAuthorization';

const AttendanceAuthorizationRequest = sequelize.define(table_name, {
  AuthorizationRequestId: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
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
    allowNull: false,
  },
  remarks: {
    type: Sequelize.STRING,
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
AttendanceAuthorizationRequest.belongsTo(usermaster, {
  foreignKey: { name: 'createBy' },
});

// AttendanceAuthorizationRequest.belongsTo(EmployeeGatepass, {
//   foreignKey: { name: 'ReferenceID' },
// });
module.exports = AttendanceAuthorizationRequest;
