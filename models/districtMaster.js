const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const StateMaster = require("./statemaster");
const table_name = "districtMaster";

const DistrictMaster = sequelize.define(
  table_name,
  {
    districtID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    districtName: {
      type: Sequelize.STRING,
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
  { paranoid: true }
);

DistrictMaster.addHook("beforeCreate", (districtMaster, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  districtMaster.createBy = options.user.userMasterId;
  districtMaster.updateBy = options.user.userMasterId;
  districtMaster.createByIp = options.user.userIpAddress;
  districtMaster.updateByIp = options.user.userIpAddress;
});

DistrictMaster.addHook("beforeUpdate", (districtMaster, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  districtMaster.updateBy = options.user.userMasterId;
  districtMaster.ipAddress = options.user.userIpAddress;
  districtMaster.updateByIp = options.user.userIpAddress;
});

DistrictMaster.addHook("beforeDestroy", (districtMaster, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  districtMaster.deleteBy = options.user.userMasterId;
  districtMaster.deleteByIp = options.user.userIpAddress;
});
DistrictMaster.belongsTo(StateMaster, {
  foreignKey: { name: "stateMasterID" },
});
module.exports = DistrictMaster;
