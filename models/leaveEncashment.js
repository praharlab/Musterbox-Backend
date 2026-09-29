const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const HrLeaveTypes = require("./hrLeaveTypes");
const UserMaster = require("./userMaster");
const HrSalaryTransaction = require("./hrSalaryTransaction");

const LeaveEncashment = sequelize.define(
  "leaveEncashment",
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    LeaveTranId: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },

    days: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    YYYYMM: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    referenceId: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
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
  },
  {
    indexes: [
      { fields: ["userMasterID"] },
      { fields: ["LeaveTranId"] },
      { fields: ["referenceId"] },
      { fields: ["YYYYMM"] },
      { fields: ["userMasterID", "YYYYMM"] },
    ],
  }
);

LeaveEncashment.belongsTo(HrLeaveTypes, {
  foreignKey: { name: "LeaveTranId" },
});
LeaveEncashment.belongsTo(UserMaster, { foreignKey: { name: "userMasterID" } });
LeaveEncashment.belongsTo(HrSalaryTransaction, {
  foreignKey: { name: "referenceId" },
});

LeaveEncashment.belongsTo(UserMaster, {
  as: "createByUser",
  foreignKey: { name: "createBy" },
});
LeaveEncashment.belongsTo(UserMaster, {
  as: "updateByUser",
  foreignKey: { name: "updateBy" },
});

UserMaster.hasMany(LeaveEncashment, { foreignKey: { name: "userMasterID" } });

module.exports = LeaveEncashment;
