const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'site';
const UserMaster = require('./userMaster');
const companyMaster = require('./companyMaster');
const BranchMaster = require('./branchMaster');

const Site = sequelize.define(
  table_name,
  {
    siteID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    siteName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    siteCode: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    branchMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    companyMasterID: {
      type: Sequelize.BIGINT,
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
  {
    paranoid: true,
  }
);

Site.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

Site.belongsTo(BranchMaster, {
  foreignKey: { name: 'branchMasterID' },
});
Site.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

Site.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

Site.belongsTo(UserMaster, {
  as: 'deletedByUserDetails',
  foreignKey: { name: 'deleteBy' },
});

Site.addHook('beforeCreate', (data, options) => {
  data.createBy = options.user.userMasterId;
  data.createByIp = options.user.userIpAddress;
});

Site.addHook('beforeUpdate', (data, options) => {
  data.updateBy = options.user.userMasterId;
  data.updateByIp = options.user.userIpAddress;
});

Site.addHook('beforeDestroy', (data, options) => {
  data.deleteBy = options.user.userMasterId;
  data.deleteByIp = options.user.userIpAddress;
});
module.exports = Site;
