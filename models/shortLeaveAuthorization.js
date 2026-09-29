const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const UserMaster = require("./userMaster");
const UserShortLeave = require("./userShortLeave");

const ShortLeaveAuthorization = sequelize.define(
  "shortLeaveAuthorization",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    authstatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    createBy: {
      type: Sequelize.BIGINT,
    },
    updateBy: {
      type: Sequelize.BIGINT,
    },
    deleteBy: {
      type: Sequelize.BIGINT,
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
  { paranoid: true }
);

ShortLeaveAuthorization.addHook(
  "beforeCreate",
  (ShortLeaveAuthorization, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    ShortLeaveAuthorization.createBy = options.user.userMasterId;
    ShortLeaveAuthorization.updateBy = options.user.userMasterId;
    ShortLeaveAuthorization.createByIp = options.user.userIpAddress;
    ShortLeaveAuthorization.updateByIp = options.user.userIpAddress;
  }
);

ShortLeaveAuthorization.addHook(
  "beforeUpdate",
  (ShortLeaveAuthorization, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    ShortLeaveAuthorization.updateBy = options.user.userMasterId;
    ShortLeaveAuthorization.updateByIp = options.user.userIpAddress;
  }
);

ShortLeaveAuthorization.addHook(
  "beforeDestroy",
  (ShortLeaveAuthorization, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    ShortLeaveAuthorization.deleteBy = options.user.userMasterId;
    ShortLeaveAuthorization.deleteByIp = options.user.userIpAddress;
  }
);

ShortLeaveAuthorization.belongsTo(UserMaster, {
  foreignKey: { name: "userMasterID" },
});

ShortLeaveAuthorization.belongsTo(UserShortLeave, {
  foreignKey: { name: "referenceId" },
});

UserShortLeave.hasMany(ShortLeaveAuthorization, {
  foreignKey: { name: "referenceId" },
});

ShortLeaveAuthorization.belongsTo(UserMaster, {
  as: "createByUser",
  foreignKey: { name: "createBy" },
});
ShortLeaveAuthorization.belongsTo(UserMaster, {
  as: "updateByUser",
  foreignKey: { name: "updateBy" },
});
ShortLeaveAuthorization.belongsTo(UserMaster, {
  as: "deleteByUser",
  foreignKey: { name: "deleteBy" },
});

module.exports = ShortLeaveAuthorization;
