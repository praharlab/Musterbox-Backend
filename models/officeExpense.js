const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const BranchMaster = require('./branchMaster');
const Site = require('./site');
const UserMaster = require('./userMaster');
const table_name = 'officeExpenses';
const OfficeExpense = sequelize.define(
    table_name,
    {
        officeExpenseID: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        branchMasterID: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        siteID: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        expense_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
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
    {
        paranoid: true,
        indexes: [
            {
                fields: ['branchMasterID'],
            },
            {
                fields: ['branchMasterID', 'expense_date'],
            },
        ],
    }
);

OfficeExpense.addHook(
    'beforeCreate',
    (officeExpense, options) => {
        // Set createBy, updateBy, and ipAddress based on the authenticated user
        officeExpense.createBy = options.user.userMasterId;
        officeExpense.createByIp = options.user.userIpAddress;
    }
);

OfficeExpense.addHook(
    'beforeUpdate',
    (officeExpense, options) => {
        officeExpense.updateBy = options.user.userMasterId;
        officeExpense.updateByIp = options.user.userIpAddress;
    }
);

OfficeExpense.addHook(
    'beforeDestroy',
    (officeExpense, options) => {
        // Set deleteBy and ipAddress based on the authenticated user
        officeExpense.deleteBy = options.user.userMasterId;
        officeExpense.deleteByIp = options.user.userIpAddress;
    }
);

OfficeExpense.belongsTo(BranchMaster, { foreignKey: { name: 'branchMasterID' } });

OfficeExpense.belongsTo(UserMaster, {
  as: 'createdBy',
  foreignKey: { name: 'createBy' },
});

BranchMaster.hasMany(OfficeExpense, {
    foreignKey: { name: 'branchMasterID' },
});

OfficeExpense.belongsTo(Site, { foreignKey: { name: 'siteID' } });

Site.hasMany(OfficeExpense, {
    foreignKey: { name: 'siteID' },
});

module.exports = OfficeExpense;
