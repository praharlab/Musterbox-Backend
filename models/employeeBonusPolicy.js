const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const BonusPolicy = require('./bonusPolicy');

const EmployeeBonusPolicy = sequelize.define(
    'employeeBonusPolicy',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        applicableYYYYMM: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        endYYYYMM: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        status: {
            type: Sequelize.INTEGER,
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
    },
    {
        paranoid: true,
    }
);

EmployeeBonusPolicy.addHook('beforeCreate', (EmployeeBonusPolicy, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    EmployeeBonusPolicy.createBy = options.user.userMasterId;
    EmployeeBonusPolicy.createByIp = options.user.userIpAddress;
});

EmployeeBonusPolicy.addHook('beforeUpdate', (EmployeeBonusPolicy, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    EmployeeBonusPolicy.updateBy = options.user.userMasterId;
    EmployeeBonusPolicy.updateByIp = options.user.userIpAddress;
});

EmployeeBonusPolicy.addHook('beforeDestroy', (EmployeeBonusPolicy, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    EmployeeBonusPolicy.deleteBy = options.user.userMasterId;
    EmployeeBonusPolicy.deleteByIp = options.user.userIpAddress;
});

EmployeeBonusPolicy.belongsTo(UserMaster, {
    foreignKey: { name: 'userMasterID', allowNull: false },
});
EmployeeBonusPolicy.belongsTo(BonusPolicy, {
    foreignKey: { name: 'bonusPolicyId', allowNull: false },
});
UserMaster.hasMany(EmployeeBonusPolicy, {
    foreignKey: { name: 'userMasterID' },
});

EmployeeBonusPolicy.belongsTo(UserMaster, {
    as: 'createdBy',
    foreignKey: { name: 'createBy' },
});

EmployeeBonusPolicy.belongsTo(UserMaster, {
    as: 'updatedBy',
    foreignKey: { name: 'updateBy' },
});
EmployeeBonusPolicy.belongsTo(UserMaster, {
    as: 'deletedBy',
    foreignKey: { name: 'deleteBy' },
});


module.exports = EmployeeBonusPolicy;
