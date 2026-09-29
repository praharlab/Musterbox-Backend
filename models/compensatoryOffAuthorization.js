const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const coffMaster = require('./coffMaster');
const UserMaster = require('./userMaster');
const table_name = 'compensatoryOffAuthorization';

const CompensatoryOffAuthorization = sequelize.define(
  table_name,
  {
    CompensatoryOffAuthorizationID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    authstatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    TableName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    remarks: {
      type: Sequelize.STRING,
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
  },
  { paranoid: true }
);

CompensatoryOffAuthorization.belongsTo(UserMaster, {
  as: 'authorizedPerson',
  foreignKey: { name: 'userMasterID' },
});
CompensatoryOffAuthorization.belongsTo(UserMaster, {
  as: 'createdByuser',
  foreignKey: { name: 'createBy' },
});

CompensatoryOffAuthorization.belongsTo(UserMaster, {
  as: 'updatedByUser',
  foreignKey: { name: 'updateBy' },
});

CompensatoryOffAuthorization.belongsTo(UserMaster, {
  as: 'deletedByUser',
  foreignKey: { name: 'deleteBy' },
});
CompensatoryOffAuthorization.belongsTo(coffMaster, {
  foreignKey: { name: 'coffMasterID' },
});

coffMaster.hasMany(CompensatoryOffAuthorization, {
  foreignKey: { name: 'coffMasterID' },
});

CompensatoryOffAuthorization.addHook(
  'beforeCreate',
  (compensatoryOffAuthorization, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    compensatoryOffAuthorization.createBy = options.user.userMasterId;
    compensatoryOffAuthorization.updateBy = options.user.userMasterId;
    compensatoryOffAuthorization.createByIp = options.user.userIpAddress;
    compensatoryOffAuthorization.updateByIp = options.user.userIpAddress;
  }
);

CompensatoryOffAuthorization.addHook(
  'beforeUpdate',
  (compensatoryOffAuthorization, options) => {
    compensatoryOffAuthorization.updateBy = options.user.userMasterId;
    compensatoryOffAuthorization.ipAddress = options.user.userIpAddress;
    compensatoryOffAuthorization.updateByIp = options.user.userIpAddress;
  }
);

CompensatoryOffAuthorization.addHook(
  'beforeDestroy',
  (compensatoryOffAuthorization, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    compensatoryOffAuthorization.deleteBy = options.user.userMasterId;
    compensatoryOffAuthorization.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = CompensatoryOffAuthorization;
