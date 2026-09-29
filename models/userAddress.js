const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const CityMaster = require("./citymaster");
const UserMaster = require("./userMaster");
const DistrictMaster = require("./districtMaster");
const table_name = "userAddress";
const UserAddress = sequelize.define(
  table_name,
  {
    userAddressID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    addressType: {
      type: Sequelize.ENUM(["permanent", "temporary"]),
      allowNull: false,
    },
    houseNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    houseName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    landmark: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    area: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    zipcode: {
      type: Sequelize.INTEGER,
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
    verifyStatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    verifyBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    rejectionRemarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    districtID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    cityMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    localLangAddress: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ["addressType"],
      },
    ],
  }
);

UserAddress.belongsTo(UserMaster, { foreignKey: { name: "userMasterID" } });
UserAddress.belongsTo(CityMaster, { foreignKey: { name: "cityMasterID" } });
UserMaster.hasMany(UserAddress, { foreignKey: { name: "userMasterID" } });
UserAddress.belongsTo(DistrictMaster, { foreignKey: { name: "districtID" } });

module.exports = UserAddress;
