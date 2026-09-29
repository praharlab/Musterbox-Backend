const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const tdsSubSection = require('./tdsSubSection');


const TdsSubSectionLimit = sequelize.define(
    'tdsSubSectionLimit',
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

        maxLimit: {
            type: Sequelize.INTEGER,
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
    },
);

TdsSubSectionLimit.addHook(
    'beforeCreate',
    (TdsSubSectionLimit, options) => {
        // Set createBy, updateBy, and ipAddress based on the authenticated user
        TdsSubSectionLimit.createBy = options.user.userMasterId;
        TdsSubSectionLimit.createByIp = options.user.userIpAddress;
    }
);

TdsSubSectionLimit.addHook(
    'beforeUpdate',
    (TdsSubSectionLimit, options) => {
        // Set updateBy and ipAddress based on the authenticated user
        TdsSubSectionLimit.updateBy = options.user.userMasterId;
        TdsSubSectionLimit.updateByIp = options.user.userIpAddress;
    }
);

TdsSubSectionLimit.belongsTo(tdsSubSection, {
    foreignKey: { allowNull: false, name: 'tdsSubSectionID' },
});

tdsSubSection.hasMany(TdsSubSectionLimit, {
    foreignKey: { name: 'tdsSubSectionID' },
});


module.exports = TdsSubSectionLimit;
