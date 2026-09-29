const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const CompanyMaster = require("./companyMaster");
const table_name = "discrepancyLetter";

const DiscrepancyLetter = sequelize.define(
  table_name,
  {
    discrepancyLetterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    discrepancyLetterName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    letterTemplate: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    letterHead: {
      type: Sequelize.STRING,
      allowNull: false,
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
  {
    paranoid: true,
  }
);

DiscrepancyLetter.belongsTo(CompanyMaster, {
  foreignKey: { name: "companyMasterID" },
});

DiscrepancyLetter.addHook("beforeCreate", (discrepancyLetter, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  discrepancyLetter.createBy = options.user.userMasterId;
  discrepancyLetter.updateBy = options.user.userMasterId;
  discrepancyLetter.createByIp = options.user.userIpAddress;
  discrepancyLetter.updateByIp = options.user.userIpAddress;
});

DiscrepancyLetter.addHook("beforeUpdate", (discrepancyLetter, options) => {
  discrepancyLetter.updateBy = options.user.userMasterId;
  discrepancyLetter.ipAddress = options.user.userIpAddress;
  discrepancyLetter.updateByIp = options.user.userIpAddress;
});

DiscrepancyLetter.addHook("beforeDestroy", (discrepancyLetter, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  discrepancyLetter.deleteBy = options.user.userMasterId;
  discrepancyLetter.deleteByIp = options.user.userIpAddress;
});

module.exports = DiscrepancyLetter;
