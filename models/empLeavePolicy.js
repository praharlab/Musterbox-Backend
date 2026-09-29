const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const employeeLeavePolicy = require('./employeeLeavePolicy');

const empLeavePolicy = sequelize.define(
  'empLeavePolicy',
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
    employeeLeavePolicyID: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
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
  { paranoid: true }
);

// empLeavePolicy.belongsTo(employeeLeavePolicy, {
//     foreignKey: { name: 'employeeLeavePolicyID' },
// });

empLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
  as: 'employee',
});

empLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
empLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});

empLeavePolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

UserMaster.hasMany(empLeavePolicy, {
  foreignKey: { name: 'userMasterID' },
});

empLeavePolicy.addHook('beforeCreate', (empleave, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  empleave.createBy = options.user.userMasterId;
  empleave.updateBy = options.user.userMasterId;
  empleave.createByIp = options.user.userIpAddress;
  empleave.updateByIp = options.user.userIpAddress;
});

empLeavePolicy.addHook('beforeUpdate', (empleave, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  empleave.updateBy = options.user.userMasterId;
  empleave.ipAddress = options.user.userIpAddress;
  empleave.updateByIp = options.user.userIpAddress;
});

empLeavePolicy.addHook('beforeDestroy', (empleave, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  empleave.deleteBy = options.user.userMasterId;
  empleave.deleteByIp = options.user.userIpAddress;
});
module.exports = empLeavePolicy;
