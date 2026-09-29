const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const FormMaster = require('./formMaster');
const RoleMaster = require('./roleMaster');
const Operation = require('./operation');
const table_name = 'rolePermission';
const RolePermission = sequelize.define(
  table_name,
  {
    rolePermissionID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
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
    deleteBy: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true,
    indexes: [
      {
        unique: false,
        fields: ['roleMasterID', 'formMasterID'],
      },
    ],
  }
);

RolePermission.addHook('beforeCreate', (RolePermission, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  RolePermission.createBy = options.user.userMasterId;
  RolePermission.createByIp = options.user.userIpAddress;
});

RolePermission.addHook('beforeUpdate', (RolePermission, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  RolePermission.updateBy = options.user.userMasterId;
  RolePermission.updateByIp = options.user.userIpAddress;
});

RolePermission.addHook('beforeDestroy', (RolePermission, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  RolePermission.deleteBy = options.user.userMasterId;
  RolePermission.deleteByIp = options.user.userIpAddress;
});

RolePermission.belongsTo(FormMaster, {
  foreignKey: { name: 'formMasterID' },
});
RolePermission.belongsTo(RoleMaster, {
  foreignKey: { name: 'roleMasterID' },
});
RoleMaster.hasMany(RolePermission, {
  foreignKey: { name: 'roleMasterID' },
});
RolePermission.belongsTo(Operation, { foreignKey: { name: 'operationID' } });

module.exports = RolePermission;
