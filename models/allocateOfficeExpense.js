const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const BranchMaster = require('./branchMaster');
const UserMaster = require('./userMaster');
const Site = require('./site');
const table_name = 'allocateOfficeExpenseRights';
const AllocateOfficeExpenseRights = sequelize.define(
    table_name,
    {
        allocateOfficeExpenseRightsID: {
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

AllocateOfficeExpenseRights.addHook(
    'beforeCreate',
    (user, options) => {
        // Set createBy, updateBy, and ipAddress based on the authenticated user
        user.createBy = options.user.userMasterId;
        user.createByIp = options.user.userIpAddress;
    }
);

AllocateOfficeExpenseRights.addHook(
    'beforeUpdate',
    (user, options) => {
        user.updateBy = options.user.userMasterId;
        user.updateByIp = options.user.userIpAddress;
    }
);

AllocateOfficeExpenseRights.addHook(
    'beforeDestroy',
    (user, options) => {
        // Set deleteBy and ipAddress based on the authenticated user
        user.deleteBy = options.user.userMasterId;
        user.deleteByIp = options.user.userIpAddress;
    }
);

AllocateOfficeExpenseRights.belongsTo(BranchMaster, { foreignKey: { name: 'branchMasterID' } });
AllocateOfficeExpenseRights.belongsTo(Site, { foreignKey: { name: 'siteID' } });

AllocateOfficeExpenseRights.belongsTo(UserMaster, {
  foreignKey: { name: "userMasterID" },
});

AllocateOfficeExpenseRights.belongsTo(UserMaster, {
  foreignKey: { name: "createBy" },
  as: "createdBy",
});

AllocateOfficeExpenseRights.belongsTo(UserMaster, {
  foreignKey: { name: "updateBy" },
  as: "updatedBy",
});


module.exports = AllocateOfficeExpenseRights;
