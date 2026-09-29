const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const BankMaster = require('./bankMaster');
const table_name = 'bankStatementFormat';
const BankStatementFormat = sequelize.define(
    table_name,
    {
        bankStatementFormatID: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        companyMasterID: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        bankMasterID: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        fields: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: false
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
        paranoid: true
    }
);
BankStatementFormat.addHook('beforeCreate', (bankStatementFormat, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    bankStatementFormat.createBy = options.user.userMasterId;
    bankStatementFormat.updateBy = options.user.userMasterId;
    bankStatementFormat.createByIp = options.user.userIpAddress;
    bankStatementFormat.updateByIp = options.user.userIpAddress;
});

BankStatementFormat.addHook('beforeUpdate', (bankStatementFormat, options) => {
    bankStatementFormat.updateBy = options.user.userMasterId;
    bankStatementFormat.ipAddress = options.user.userIpAddress;
    bankStatementFormat.updateByIp = options.user.userIpAddress;
});

BankStatementFormat.addHook('beforeDestroy', (bankStatementFormat, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    bankStatementFormat.deleteBy = options.user.userMasterId;
    bankStatementFormat.deleteByIp = options.user.userIpAddress;
});

BankStatementFormat.belongsTo(companyMaster, {
    foreignKey: { name: 'companyMasterID' },
});

BankStatementFormat.belongsTo(BankMaster, {
    foreignKey: { name: 'bankMasterID' },
});

module.exports = BankStatementFormat;