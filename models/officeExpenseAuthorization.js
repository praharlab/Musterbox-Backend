const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const usermaster = require('./userMaster');
const OfficeExpenseTransaction = require('./officeExpenseTransaction');
const table_name = 'officeExpenseAuth';
const OfficeExpenseAuthorizationRequest = sequelize.define(table_name, {
    officeExpenseAuthRequestId: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    // officeExpenseTransactionID
    ReferenceID: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    // ID of Authorized Person
    userMasterID: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    authstatus: {
        type: Sequelize.INTEGER,
        allowNull: true, // 1=> Accept 2=> Pending 0=> Reject
    },
    remarks: {
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
    viewstatus: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
},{
    paranoid: true
});

OfficeExpenseAuthorizationRequest.belongsTo(usermaster, {
    foreignKey: { name: 'createBy' },
});

OfficeExpenseAuthorizationRequest.belongsTo(OfficeExpenseTransaction, {
    foreignKey: { name: 'ReferenceID' },
});

OfficeExpenseAuthorizationRequest.belongsTo(usermaster, {
    as: 'authorizedPerson',
    foreignKey: { name: 'userMasterID' },
});

OfficeExpenseTransaction.hasMany(OfficeExpenseAuthorizationRequest, {
    foreignKey: { name: 'ReferenceID' },
});
OfficeExpenseTransaction.hasMany(OfficeExpenseAuthorizationRequest, {
    as: 'Auth',
    foreignKey: { name: 'ReferenceID' },
});

// OfficeExpenseAuthorizationRequest.sync({alter: true}).then(() => console.log('updated'))
module.exports = OfficeExpenseAuthorizationRequest;
