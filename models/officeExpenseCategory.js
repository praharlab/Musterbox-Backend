const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'officeExpenseCategory';
const CompanyMaster = require('./companyMaster');
const OfficeExpenseCategory = sequelize.define(table_name, {
    officeExpenseCategoryID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    officeExpenseCategory: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    companyMasterID: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    status: {
        type: Sequelize.BIGINT,
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
},{
    paranoid: true
});

OfficeExpenseCategory.belongsTo(CompanyMaster, {
    foreignKey: { name: 'companyMasterID' },
});

OfficeExpenseCategory.addHook('beforeCreate', (officeExpenseCategory, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    officeExpenseCategory.createBy = options.user.userMasterId;
    officeExpenseCategory.updateBy = options.user.userMasterId;
    officeExpenseCategory.createByIp = options.user.userIpAddress;
    officeExpenseCategory.updateByIp = options.user.userIpAddress;
});

OfficeExpenseCategory.addHook('beforeUpdate', (officeExpenseCategory, options) => {
    officeExpenseCategory.updateBy = options.user.userMasterId;
    officeExpenseCategory.ipAddress = options.user.userIpAddress;
    officeExpenseCategory.updateByIp = options.user.userIpAddress;
});

OfficeExpenseCategory.addHook('beforeDestroy', (officeExpenseCategory, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    officeExpenseCategory.deleteBy = options.user.userMasterId;
    officeExpenseCategory.deleteByIp = options.user.userIpAddress;
});

module.exports = OfficeExpenseCategory;
