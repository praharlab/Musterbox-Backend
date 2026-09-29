const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const CompanyMaster = require("./companyMaster");
const depositcategory = require("./depositCategory");
const UserMaster = require("./userMaster");
const table_name = "deposits";
const deposit = sequelize.define(table_name, {
  depositId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  depositCategoryID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  amount: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  dateOfDeposit: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  depositReceiveAs: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  salaryMonth: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  refundDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  refundRemarks: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  refundMode: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
    //forign key
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

  // depositPayAs: {
  //   type: Sequelize.STRING,
  //   allowNull: true,
  // },
  // salaryMonthToPay: {
  //   type: Sequelize.INTEGER,
  //   allowNull: true,
  // },

  ReferenceId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  TableName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

deposit.belongsTo(CompanyMaster, { foreignKey: { name: "companyMasterID" } });
deposit.belongsTo(depositcategory, {
  foreignKey: { name: "depositCategoryID" },
});
deposit.belongsTo(UserMaster, { foreignKey: { name: "userMasterID" } });

UserMaster.hasMany(deposit, { foreignKey: { name: "userMasterID" } });


module.exports = deposit;
