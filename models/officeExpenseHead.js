const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'officeExpenseHead';
const OfficeExpenseCategory = require('./officeExpenseCategory');
const OfficeExpenseHead = sequelize.define(table_name, {
    officeExpenseHeadID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    officeExpenseHead: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    officeExpenseCategoryID: {
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

OfficeExpenseHead.belongsTo(OfficeExpenseCategory, {
    foreignKey: { name: 'officeExpenseCategoryID' },
});

OfficeExpenseHead.addHook('beforeCreate', (officeExpenseHead, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    officeExpenseHead.createBy = options.user.userMasterId;
    officeExpenseHead.updateBy = options.user.userMasterId;
    officeExpenseHead.createByIp = options.user.userIpAddress;
    officeExpenseHead.updateByIp = options.user.userIpAddress;
});

OfficeExpenseHead.addHook('beforeUpdate', (officeExpenseHead, options) => {
    officeExpenseHead.updateBy = options.user.userMasterId;
    officeExpenseHead.ipAddress = options.user.userIpAddress;
    officeExpenseHead.updateByIp = options.user.userIpAddress;
});

OfficeExpenseHead.addHook('beforeDestroy', (officeExpenseHead, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    officeExpenseHead.deleteBy = options.user.userMasterId;
    officeExpenseHead.deleteByIp = options.user.userIpAddress;
});

module.exports = OfficeExpenseHead;
