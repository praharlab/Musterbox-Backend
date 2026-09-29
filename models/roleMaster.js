const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'roleMaster';
const { roleType, companyAccessType } = require('../utils/dbUtils');

const RoleMaster = sequelize.define(
  table_name,
  {
    roleMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    roleName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    roleType: {
      type: Sequelize.ENUM(...Object.values(roleType)),
      allowNull: true,
    },
    companyAccessType: {
      type: Sequelize.ENUM(...Object.values(companyAccessType)),
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
  }
);

RoleMaster.addHook('beforeCreate', (RoleMaster, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  RoleMaster.createBy = options.user.userMasterId;
  RoleMaster.createByIp = options.user.userIpAddress;
});

RoleMaster.addHook('beforeUpdate', (RoleMaster, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  RoleMaster.updateBy = options.user.userMasterId;
  RoleMaster.updateByIp = options.user.userIpAddress;
});

RoleMaster.addHook('beforeDestroy', (RoleMaster, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  RoleMaster.deleteBy = options.user.userMasterId;
  RoleMaster.deleteByIp = options.user.userIpAddress;
});

RoleMaster.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = RoleMaster;
