const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const UserMaster = require("./userMaster");
const attendanceTransaction = require("./attendanceTransaction");

const UserShortLeave = sequelize.define(
  "userShortLeave",
  {
    userShortLeaveId: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    cancelRemarks: {
      type: Sequelize.STRING,
      allowNull: true,
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
    createBy: {
      type: Sequelize.BIGINT,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    deleteBy: {
      type: Sequelize.BIGINT,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  {
    paranoid: true,
  }
);

UserShortLeave.addHook("beforeCreate", (UserShortLeave, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  UserShortLeave.createBy = options.user.userMasterId;
  UserShortLeave.updateBy = options.user.userMasterId;
  UserShortLeave.createByIp = options.user.userIpAddress;
  UserShortLeave.updateByIp = options.user.userIpAddress;
});

UserShortLeave.addHook("beforeUpdate", (UserShortLeave, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  UserShortLeave.updateBy = options.user.userMasterId;
  UserShortLeave.updateByIp = options.user.userIpAddress;
});

UserShortLeave.addHook("beforeDestroy", (UserShortLeave, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  UserShortLeave.deleteBy = options.user.userMasterId;
  UserShortLeave.deleteByIp = options.user.userIpAddress;
});

UserShortLeave.belongsTo(UserMaster, { foreignKey: { name: "userMasterID" } });

UserMaster.hasMany(UserShortLeave, { foreignKey: { name: "userMasterID" } });

UserShortLeave.belongsTo(UserMaster, {
  as: "createByUser",
  foreignKey: { name: "createBy" },
});
UserShortLeave.belongsTo(UserMaster, {
  as: "updateByUser",
  foreignKey: { name: "updateBy" },
});
UserShortLeave.belongsTo(UserMaster, {
  as: "deleteByUser",
  foreignKey: { name: "deleteBy" },
});

UserShortLeave.belongsTo(attendanceTransaction, { foreignKey: { name: "AttendanceTransID" } });

attendanceTransaction.hasMany(UserShortLeave, { foreignKey: { name: "AttendanceTransID" } });

module.exports = UserShortLeave;
