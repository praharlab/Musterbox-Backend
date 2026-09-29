const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');

const EmployeeRentedResidence = sequelize.define(
  'employeeRentedResidence',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    financialYear: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    fromMonth: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    toMonth: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    amount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    city: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    attachment: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    ownerName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ownerAddress: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ownerPAN: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ownerAttachment: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    acceptRejectRemark: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    authStatus: {
      //0-pending 1-accepted 2-rejected
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleteBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true }
);

EmployeeRentedResidence.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeRentedResidence.addHook(
  'beforeCreate',
  (employeeRentedResidence, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    employeeRentedResidence.createBy = options.user.userMasterId;
    employeeRentedResidence.updateBy = options.user.userMasterId;
    employeeRentedResidence.createByIp = options.user.userIpAddress;
    employeeRentedResidence.updateByIp = options.user.userIpAddress;
  }
);

EmployeeRentedResidence.addHook(
  'beforeUpdate',
  async (employeeRentedResidence, options) => {
    // Set updatedBy and ipAddress based on the authenticated user
    employeeRentedResidence.updateBy = options.user.userMasterId;
    employeeRentedResidence.updateByIp = options.user.userIpAddress;
  }
);

EmployeeRentedResidence.addHook(
  'beforeDestroy',
  (employeeRentedResidence, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    employeeRentedResidence.deleteBy = options.user.userMasterId;
    employeeRentedResidence.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = EmployeeRentedResidence;
