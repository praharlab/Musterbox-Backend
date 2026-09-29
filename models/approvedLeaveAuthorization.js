const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const UserMaster = require("./userMaster");
const LeaveAuthorizationRequest = require("./leaveAuthorization");
const HrLeaveTypes = require("./hrLeaveTypes");
const UserLeave = require("./userleave");
const table_name = "approvedLeaveAuthorization";

const ApprovedLeaveAuthorization = sequelize.define(
  table_name,
  {
    approvedLeaveAuthorizationID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    UserLeaveApplicationID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    AuthorizationRequestId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    LeaveTranId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    days: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    issandwichleave: {
      type: Sequelize.INTEGER,
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
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
  },
);

ApprovedLeaveAuthorization.addHook(
  "beforeCreate",
  (approvedLeaveAuthorization, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    approvedLeaveAuthorization.createBy = options.user.userMasterId;
    approvedLeaveAuthorization.createByIp = options.user.userIpAddress;
  }
);

ApprovedLeaveAuthorization.addHook(
  "beforeBulkCreate",
  (approvedLeaveAuthorization, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    approvedLeaveAuthorization.forEach((answer) => {
      answer.createBy = options.user.userMasterId;
      answer.createByIp = options.user.userIpAddress;
    });
  }
);

ApprovedLeaveAuthorization.addHook(
  "beforeUpdate",
  (approvedLeaveAuthorization, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    approvedLeaveAuthorization.updateBy = options.user.userMasterId;
    approvedLeaveAuthorization.updateByIp = options.user.userIpAddress;
  }
);

ApprovedLeaveAuthorization.belongsTo(UserLeave, {
  foreignKey: { name: "UserLeaveApplicationID" },
});

ApprovedLeaveAuthorization.belongsTo(LeaveAuthorizationRequest, {
  foreignKey: { name: "AuthorizationRequestId" },
});

ApprovedLeaveAuthorization.belongsTo(HrLeaveTypes, {
  foreignKey: { name: "LeaveTranId" },
});

ApprovedLeaveAuthorization.belongsTo(UserMaster, {
  as: "createdByUserDetails",
  foreignKey: { name: "createBy" },
});

ApprovedLeaveAuthorization.belongsTo(UserMaster, {
  as: "updatedByUserDetails",
  foreignKey: { name: "updateBy" },
});

UserLeave.hasMany(ApprovedLeaveAuthorization, {
  foreignKey: { name: "UserLeaveApplicationID" },
});

LeaveAuthorizationRequest.hasMany(ApprovedLeaveAuthorization, {
  foreignKey: { name: "AuthorizationRequestId" },
});
module.exports = ApprovedLeaveAuthorization;
