const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const { PayrollFrequencyType } = require('../utils/dbUtils');
const table_name = 'paySlip';
const PaySlip = sequelize.define(
    table_name,
    {
        id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        userMasterID: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        yearMonth: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        payrollFrequency: {
            type: Sequelize.ENUM(...Object.values(PayrollFrequencyType)),
            allowNull: false,
        },
        startDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        endDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        path: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        createBy: {
            type: Sequelize.INTEGER,
        },
        updateBy: {
            type: Sequelize.INTEGER,
        },
        createByIp: {
            type: Sequelize.STRING,
        },
        updateByIp: {
            type: Sequelize.STRING,
        },
    },
    {
        indexes: [
            {
                unique: false,
                fields: ['userMasterID'],
            },
        ],
    }
);

PaySlip.addHook('beforeCreate', (PaySlip, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    PaySlip.createBy = options.user.userMasterId;
    PaySlip.createByIp = options.user.userIpAddress;

});

PaySlip.addHook('beforeUpdate', (PaySlip, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    PaySlip.updateBy = options.user.userMasterId;
    PaySlip.updateByIp = options.user.userIpAddress;
});

PaySlip.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });
userMaster.hasMany(PaySlip, { foreignKey: { name: 'userMasterID' } });


module.exports = PaySlip;
