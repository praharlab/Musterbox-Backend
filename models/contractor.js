const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const companyMaster = require("./companyMaster");
const CityMaster = require("./citymaster");
const BankMaster = require("./bankMaster");
const table_name = "contractor";

const Contractor = sequelize.define(
  table_name,
  {
    contractorId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    contractorName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    shortName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    contractorCode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    website: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    contactPersonName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    contactNo: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    dateofIncorporation: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    // forgein key
    cityMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    // forgein key
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    registrationNo: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    aboutContractor: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    bankIFSC: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    bankAccountNo: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    pancard: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    gstNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    contractorAddress: {
      type: Sequelize.TEXT,
      allowNull: true,
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
    localName: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    localAddress: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    paranoid: true,
  }
);

Contractor.belongsTo(BankMaster, {
  foreignKey: { name: "bankMasterID", allowNull: true },
});

Contractor.addHook("beforeCreate", (contractor, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  contractor.createBy = options.user.userMasterId;
  contractor.createByIp = options.user.userIpAddress;
});

Contractor.addHook("beforeUpdate", (contractor, options) => {
  contractor.updateBy = options.user.userMasterId;
  contractor.updateByIp = options.user.userIpAddress;
});

Contractor.addHook("beforeDestroy", (contractor, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  contractor.deleteBy = options.user.userMasterId;
  contractor.deleteByIp = options.user.userIpAddress;
});

Contractor.belongsTo(companyMaster, {
  foreignKey: { name: "companyMasterID" },
});
Contractor.belongsTo(CityMaster, {
  foreignKey: { name: "cityMasterID" },
});

module.exports = Contractor;
