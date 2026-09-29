const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const ShortLeave = require('./shortLeave');
const table_name = 'employeeShortLeavePolicy';
const EmployeeShortLeavePolicy = sequelize.define(
    table_name,
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        userMasterID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        shortLeavePolicyID: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        applicableDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
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
    { paranoid: true }
);

EmployeeShortLeavePolicy.addHook(
  'beforeCreate',
  (employeeShortLeavePolicy, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    employeeShortLeavePolicy.createBy = options.user.userMasterId;
    employeeShortLeavePolicy.updateBy = options.user.userMasterId;
    employeeShortLeavePolicy.createByIp = options.user.userIpAddress;
    employeeShortLeavePolicy.updateByIp = options.user.userIpAddress;
  }
);

EmployeeShortLeavePolicy.addHook(
  'beforeUpdate',
  (employeeShortLeavePolicy, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    employeeShortLeavePolicy.updateBy = options.user.userMasterId;
    employeeShortLeavePolicy.updateByIp = options.user.userIpAddress;
  }
);

EmployeeShortLeavePolicy.addHook(
  'beforeDestroy',
  (employeeShortLeavePolicy, options) => {
    employeeShortLeavePolicy.deleteBy = options.user.userMasterId;
    employeeShortLeavePolicy.deleteByIp = options.user.userIpAddress;
  }
);

EmployeeShortLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
  as: 'employee',
});

EmployeeShortLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
EmployeeShortLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});

EmployeeShortLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

UserMaster.hasMany(EmployeeShortLeavePolicy, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeShortLeavePolicy.belongsTo(ShortLeave,{
    foreignKey: { name: 'shortLeavePolicyID' },
});


module.exports = EmployeeShortLeavePolicy;
