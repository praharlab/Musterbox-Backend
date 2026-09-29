const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const RoleMaster = require('./roleMaster');

const UserRole = sequelize.define(
  'userRole',
  {
    userRoleID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    roleMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
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
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
    ],
  }
);

UserRole.addHook('beforeCreate', (UserRole, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  UserRole.createBy = options.user.userMasterId;
  UserRole.createByIp = options.user.userIpAddress;
});

UserRole.addHook('beforeUpdate', (UserRole, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  UserRole.updateBy = options.user.userMasterId;
  UserRole.updateByIp = options.user.userIpAddress;
});

UserRole.addHook('beforeDestroy', (UserRole, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  UserRole.deleteBy = options.user.userMasterId;
  UserRole.deleteByIp = options.user.userIpAddress;
});

UserRole.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

UserRole.belongsTo(UserMaster, {
  as: 'createByUser',
  foreignKey: { name: 'createBy' },
});

UserRole.belongsTo(RoleMaster, {
  foreignKey: { name: 'roleMasterID' },
});

UserMaster.hasMany(UserRole, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = UserRole;
