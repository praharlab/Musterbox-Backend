const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "officeExpenseTransactions";
const AuthorizationCriteriaMaster = require("./authorizationCriteriaMaster");
const OfficeExpense = require("./officeExpense");
const OfficeExpenseHead = require("./officeExpenseHead");
const OfficeExpenseTransaction = sequelize.define(
  table_name,
  {
    officeExpenseTransactionID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    oldExpenseTransID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    officeExpenseID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    officeExpenseHeadID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    expensePriceRuleID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    expenseAmount: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    attachFile: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    attachFile2: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    attachFile3: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    attachFile4: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    erpJvid: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    authorizationStatus: {
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
    payment_Id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    syncType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
    AuthorizationCriteriaID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
  },
  { paranoid: true }
);

OfficeExpenseTransaction.addHook(
    'beforeCreate',
    (officeExpenseTransaction, options) => {
        // Set createBy, updateBy, and ipAddress based on the authenticated user
        officeExpenseTransaction.createBy = options.user.userMasterId;
        officeExpenseTransaction.createByIp = options.user.userIpAddress;
    }
);

OfficeExpenseTransaction.addHook(
    'beforeUpdate',
    (officeExpenseTransaction, options) => {
        officeExpenseTransaction.updateBy = options.user.userMasterId;
        officeExpenseTransaction.updateByIp = options.user.userIpAddress;
    }
);

OfficeExpenseTransaction.addHook(
    'beforeDestroy',
    (officeExpenseTransaction, options) => {
        // Set deleteBy and ipAddress based on the authenticated user
        officeExpenseTransaction.deleteBy = options.user.userMasterId;
        officeExpenseTransaction.deleteByIp = options.user.userIpAddress;
    }
);

OfficeExpenseTransaction.belongsTo(OfficeExpense, {
  as: "officeExpense",
  foreignKey: { name: "officeExpenseID" },
});

OfficeExpense.hasMany(OfficeExpenseTransaction, {
  foreignKey: { name: "officeExpenseID" },
});

OfficeExpenseTransaction.belongsTo(OfficeExpenseHead, {
  foreignKey: { name: "officeExpenseHeadID" },
});

OfficeExpenseTransaction.belongsTo(AuthorizationCriteriaMaster, {
  foreignKey: { name: "AuthorizationCriteriaID" },
});

module.exports = OfficeExpenseTransaction;
