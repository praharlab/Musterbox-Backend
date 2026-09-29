const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const UserMaster = require("./userMaster");
const AttendanceCorrectionReason = require("./attendanceCorrectionReason");
const table_name = "attendanceCorrectionRequest";

const AttendanceCorrectionRequest = sequelize.define(
  table_name,
  {
    attendanceCorrectionRequestId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    AttendanceDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    authorizationStatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    correctionStatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    remark: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    attendanceCorrectionReasonID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.INTEGER,
    },
    updateBy: {
      type: Sequelize.INTEGER,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  {
    paranoid: true,
  }
);

AttendanceCorrectionRequest.belongsTo(UserMaster, {
  as: "employee",
  foreignKey: { name: "userMasterID" },
});

AttendanceCorrectionRequest.belongsTo(UserMaster, {
  as: "createdByUser",
  foreignKey: { name: "createBy" },
});

AttendanceCorrectionRequest.belongsTo(UserMaster, {
  as: "updatedByUser",
  foreignKey: { name: "updateBy" },
});

AttendanceCorrectionRequest.belongsTo(UserMaster, {
  as: "deletedByUser",
  foreignKey: { name: "deleteBy" },
});
AttendanceCorrectionRequest.belongsTo(AttendanceCorrectionReason, {
  foreignKey: { name: "attendanceCorrectionReasonID" },
});
AttendanceCorrectionRequest.addHook(
  "beforeCreate",
  (attendanceCorrectionRequest, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    attendanceCorrectionRequest.createBy = options.user.userMasterId;
    attendanceCorrectionRequest.createByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionRequest.addHook(
  "beforeUpdate",
  (attendanceCorrectionRequest, options) => {
    attendanceCorrectionRequest.updateBy = options.user.userMasterId;
    attendanceCorrectionRequest.updateByIp = options.user.userIpAddress;
  }
);

AttendanceCorrectionRequest.addHook(
  "beforeDestroy",
  (attendanceCorrectionRequest, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    attendanceCorrectionRequest.deleteBy = options.user.userMasterId;
    attendanceCorrectionRequest.deleteByIp = options.user.userIpAddress;
  }
);
module.exports = AttendanceCorrectionRequest;
