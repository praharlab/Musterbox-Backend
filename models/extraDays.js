const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Employeeincentive = require('./employeeincentive');
const table_name = 'extraDays';

const ExtraDays = sequelize.define(table_name, {
    extraDaysID: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    userMasterID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    days: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    employeeincentiveID: {
        type: Sequelize.BIGINT,
    },
    authorizationStatus: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    remarks: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    cancelRemarks: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    createBy: {
        type: Sequelize.BIGINT,
    },
    updateBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    deleteBy: {
        type: Sequelize.BIGINT,
    },
    createByIp: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    updateByIp: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    deleteByIp: {
        type: Sequelize.STRING,
    },
    From: {
        type: Sequelize.STRING,
        allowNull: true,
    }
},
    {
        paranoid: true
    })

ExtraDays.addHook("beforeCreate", (extraDays, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    extraDays.createBy = options.user.userMasterId;
    extraDays.updateBy = options.user.userMasterId;
    extraDays.createByIp = options.user.userIpAddress;
    extraDays.updateByIp = options.user.userIpAddress;
});

ExtraDays.addHook("beforeUpdate", (extraDays, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    extraDays.updateBy = options.user.userMasterId;
    extraDays.updateByIp = options.user.userIpAddress;
});

ExtraDays.addHook("beforeDestroy", (extraDays, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    extraDays.deleteBy = options.user.userMasterId;
    extraDays.deleteByIp = options.user.userIpAddress;
});

ExtraDays.belongsTo(UserMaster, { foreignKey: { name: "userMasterID" } });

UserMaster.hasMany(ExtraDays, { foreignKey: { name: "userMasterID" } });

ExtraDays.belongsTo(UserMaster, {
    as: "createByUser",
    foreignKey: { name: "createBy" },
});
ExtraDays.belongsTo(UserMaster, {
    as: "updateByUser",
    foreignKey: { name: "updateBy" },
});
ExtraDays.belongsTo(UserMaster, {
    as: "deleteByUser",
    foreignKey: { name: "deleteBy" },
});

ExtraDays.belongsTo(Employeeincentive, {
    foreignKey: { name: 'employeeincentiveID' }
})

Employeeincentive.hasMany(ExtraDays, {
    foreignKey: { name: 'employeeincentiveID' }
});


module.exports = ExtraDays;