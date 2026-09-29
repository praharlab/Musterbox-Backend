const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { PayrollFrequencyType } = require('../utils/dbUtils');
const HrSalaryFields = require('../models/hrSalaryFields')

const PaySlipGenerator = sequelize.define(
    'paySlipGenerator',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        payrollFrequency: {
            type: Sequelize.ENUM(...Object.values(PayrollFrequencyType)),
            allowNull: false,
        },
        actualWorkingHrs: {
            type: Sequelize.FLOAT,
            allowNull: true,
        },
        amount: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        YTD: {
            type: Sequelize.FLOAT,
            allowNull: true,
        },
        yearMonth: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        startDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        endDate: {
            type: Sequelize.DATEONLY,
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

PaySlipGenerator.addHook('beforeCreate', (PaySlipGenerator, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    PaySlipGenerator.createBy = options.user.userMasterId;
    PaySlipGenerator.createByIp = options.user.userIpAddress;
   
});

PaySlipGenerator.addHook('beforeUpdate', (PaySlipGenerator, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    PaySlipGenerator.updateBy = options.user.userMasterId;
    PaySlipGenerator.updateByIp = options.user.userIpAddress;
});

PaySlipGenerator.addHook('beforeDestroy', (PaySlipGenerator, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    PaySlipGenerator.deleteBy = options.user.userMasterId;
    PaySlipGenerator.deleteByIp = options.user.userIpAddress;
});

PaySlipGenerator.belongsTo(UserMaster, {
    foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(PaySlipGenerator, {
    foreignKey: { name: 'userMasterID' },
});

PaySlipGenerator.belongsTo(HrSalaryFields, {
    foreignKey: { name: 'salaryFieldID' },
});



module.exports = PaySlipGenerator;
