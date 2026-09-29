const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const BranchMaster = require('./branchMaster');
const Site = require('./site');
const UserMaster = require('./userMaster');
const table_name = 'officeExpenseAdvance';
const OfficeExpenseAdvance = sequelize.define(
    table_name,
    {
        officeExpenseAdvanceID: {
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
        userMasterID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        amount: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        transactionType: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        paymentMode: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        referenceNo: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        referenceDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        remarks: {
            type: Sequelize.STRING,
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
    }
);

OfficeExpenseAdvance.addHook(
    'beforeCreate',
    (officeExpenseAdvance, options) => {
        // Set createBy, updateBy, and ipAddress based on the authenticated user
        officeExpenseAdvance.createBy = options.user.userMasterId;
        officeExpenseAdvance.createByIp = options.user.userIpAddress;
    }
);

OfficeExpenseAdvance.addHook(
    'beforeUpdate',
    (officeExpenseAdvance, options) => {
        officeExpenseAdvance.updateBy = options.user.userMasterId;
        officeExpenseAdvance.updateByIp = options.user.userIpAddress;
    }
);

OfficeExpenseAdvance.addHook(
    'beforeDestroy',
    (officeExpenseAdvance, options) => {
        // Set deleteBy and ipAddress based on the authenticated user
        officeExpenseAdvance.deleteBy = options.user.userMasterId;
        officeExpenseAdvance.deleteByIp = options.user.userIpAddress;
    }
);

OfficeExpenseAdvance.belongsTo(BranchMaster, { foreignKey: { name: 'branchMasterID' } });

OfficeExpenseAdvance.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(OfficeExpenseAdvance, {
    foreignKey: { name: 'userMasterID' }
})

OfficeExpenseAdvance.belongsTo(UserMaster, {
  as: 'createdBy',
  foreignKey: { name: 'createBy' },
});

BranchMaster.hasMany(OfficeExpenseAdvance, {
    foreignKey: { name: 'branchMasterID' },
});

OfficeExpenseAdvance.belongsTo(Site, { foreignKey: { name: 'siteID' } });

Site.hasMany(OfficeExpenseAdvance, {
    foreignKey: { name: 'siteID' },
});

module.exports = OfficeExpenseAdvance;