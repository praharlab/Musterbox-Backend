const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const companyMaster = require("./companyMaster");
const UserMaster = require("./userMaster");
const {
  yearCycleEnum,
  bonusCreditTypeEnum,
  bonusCreditCycleEnum,
} = require("../utils/dbUtils");
const table_name = "bonusPolicy";
const BonusPolicy = sequelize.define(
  table_name,
  {
    bonusPolicyId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    bonusPolicyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    bonusCycle: {
      type: Sequelize.ENUM(...Object.values(yearCycleEnum)),
      allowNull: false,
    },
    bonusCreditType: {
      type: Sequelize.ENUM(...Object.values(bonusCreditTypeEnum)),
      allowNull: false,
    },
    bonusCreditCycle: {
      type: Sequelize.ENUM(...Object.values(bonusCreditCycleEnum)),
      allowNull: true,
    },
    payInSalary: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    deleteBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true },
  {
    indexes: [
      {
        unique: false,
        fields: ["bonusPolicyName"],
      },
      {
        unique: false,
        fields: ["companyMasterID"],
      },
    ],
  }
);

BonusPolicy.addHook("beforeCreate", (BonusPolicy, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  BonusPolicy.createBy = options.user.userMasterId;
  BonusPolicy.createByIp = options.user.userIpAddress;
});

BonusPolicy.addHook("beforeUpdate", (BonusPolicy, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  BonusPolicy.updateBy = options.user.userMasterId;
  BonusPolicy.updateByIp = options.user.userIpAddress;
});

BonusPolicy.addHook("beforeDestroy", (BonusPolicy, options) => {
  BonusPolicy.deleteBy = options.user.userMasterId;
  BonusPolicy.deleteByIp = options.user.userIpAddress;
});

BonusPolicy.belongsTo(companyMaster, {
  foreignKey: { name: "companyMasterID" },
});

BonusPolicy.belongsTo(UserMaster, {
  as: "createdBy",
  foreignKey: { name: "createBy" },
});

BonusPolicy.belongsTo(UserMaster, {
  as: "updatedBy",
  foreignKey: { name: "updateBy" },
});

BonusPolicy.belongsTo(UserMaster, {
  as: "deletedBy",
  foreignKey: { name: "deleteBy" },
});

module.exports = BonusPolicy;
