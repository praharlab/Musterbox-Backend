const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const formmaster = require("./formMaster");
const usermaster = require("./userMaster");
const table_name = "leaveAuthorization";
const userLeaves = require("./userleave");

const LeaveAuthorizationRequest = sequelize.define(table_name, {
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
  viewstatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  rejectionRemarks: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
});

LeaveAuthorizationRequest.belongsTo(usermaster, {
  foreignKey: { name: "createBy" },
});

LeaveAuthorizationRequest.belongsTo(usermaster, {
  as: "authorizedPerson",
  foreignKey: { name: "userMasterID" },
});

LeaveAuthorizationRequest.belongsTo(userLeaves, {
  foreignKey: { name: "ReferenceID" },
});
userLeaves.hasMany(LeaveAuthorizationRequest, {
  foreignKey: { name: "ReferenceID" },
});

LeaveAuthorizationRequest.belongsTo(usermaster, {
  as: "createdByUserDetails",
  foreignKey: { name: "createBy" },
});

LeaveAuthorizationRequest.belongsTo(usermaster, {
  as: "updatedByUserDetails",
  foreignKey: { name: "updateBy" },
});

module.exports = LeaveAuthorizationRequest;
