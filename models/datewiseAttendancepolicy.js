const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'datewiseAttendancepolicy';
const UserMaster = require('./userMaster');
const companyMaster = require('./companyMaster');
const datewiseattendancePolicy = sequelize.define(table_name, {
  datewiseAttendancepolicyID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  companyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    //forign key
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    //forign key
  },
  fromDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  ToDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  createBy: {
    type: Sequelize.INTEGER,
  },
  updateBy: {
    type: Sequelize.INTEGER,
  },
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

datewiseattendancePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
datewiseattendancePolicy.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
UserMaster.hasMany(datewiseattendancePolicy, {
  foreignKey: { name: 'userMasterID' },
});

datewiseattendancePolicy.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

datewiseattendancePolicy.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
datewiseattendancePolicy.addHook(
  'beforeCreate',
  (datewiseattendancePolicy, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    datewiseattendancePolicy.createBy = options.user.userMasterId;
    datewiseattendancePolicy.createByIp = options.user.userIpAddress;
  }
);

datewiseattendancePolicy.addHook(
  'beforeBulkCreate',
  (datewiseattendancePolicy, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    datewiseattendancePolicy.forEach((answer) => {
      answer.createBy = options.user.userMasterId;
      answer.createByIp = options.user.userIpAddress;
    });
  }
);

datewiseattendancePolicy.addHook(
  'beforeUpdate',
  (datewiseattendancePolicy, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    datewiseattendancePolicy.updateBy = options.user.userMasterId;
    datewiseattendancePolicy.updateByIp = options.user.userIpAddress;
  }
);

module.exports = datewiseattendancePolicy;
