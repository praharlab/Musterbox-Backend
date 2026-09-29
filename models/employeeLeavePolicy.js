const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const HrLeaveMaster = require('./hrLeaveMaster');
const employeeLeavePolicy = sequelize.define(
  'employeeLeavePolicy',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    leavePolicyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    leaveType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    yearlyLeave: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    leaveOperationalYear: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    minDaysRequire: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    earnBaseType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    creditPeriod: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    creditDate: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    creditType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    carryForward: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    carryForwardLimit: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    leavesToCarryForward: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    leaveLapse: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    allowFutureApplyDays: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    allowPastApplyDays: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    allowMinInMonth: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    allowMaxInMonth: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    allowHalfDays: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    employementType: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
    },
    leaveEncashment: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    cappingLeaveEncashment: {
      type: Sequelize.INTEGER,
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
    min_leave_attachment: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    priority: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    },
    // Monthly
    monthly_CF_ENC_LPS: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isMonthly_CF: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    monthly_CF_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isMonthly_ENC: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    monthly_ENC_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isMonthly_LPS: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    monthly_LPS_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },

    // Quarterly
    quarterly_CF_ENC_LPS: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isQuarterly_CF: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    quarterly_CF_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isQuarterly_ENC: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    quarterly_ENC_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isQuarterly_LPS: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    quarterly_LPS_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },

    // Half-Yearly
    halfYearly_CF_ENC_LPS: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isHalfYearly_CF: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    halfYearly_CF_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isHalfYearly_ENC: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    halfYearly_ENC_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isHalfYearly_LPS: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    halfYearly_LPS_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },

    // Yearly
    yearly_CF_ENC_LPS: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isYearly_CF: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    yearly_CF_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isYearly_ENC: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    yearly_ENC_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    isYearly_LPS: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    yearly_LPS_limit: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    fixedAmount_ENC: {
      // fix Amount for increment
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    payheadIds: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    },
    ratio: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    allowMaxInQuarter: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    allowMaxInHalfYear: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    allowMaxInYear: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  },
  { paranoid: true }
);

employeeLeavePolicy.belongsTo(HrLeaveMaster, {
  foreignKey: { name: 'leaveId' },
});
employeeLeavePolicy.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterId' },
});
employeeLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
employeeLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
employeeLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
employeeLeavePolicy.addHook('beforeCreate', (leave, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  leave.createBy = options.user.userMasterId;
  leave.updateBy = options.user.userMasterId;
  leave.createByIp = options.user.userIpAddress;
  leave.updateByIp = options.user.userIpAddress;
});

employeeLeavePolicy.addHook('beforeUpdate', (leave, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  leave.updateBy = options.user.userMasterId;
  leave.ipAddress = options.user.userIpAddress;
  leave.updateByIp = options.user.userIpAddress;
});

employeeLeavePolicy.addHook('beforeDestroy', (leave, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  leave.deleteBy = options.user.userMasterId;
  leave.deleteByIp = options.user.userIpAddress;
});

module.exports = employeeLeavePolicy;
