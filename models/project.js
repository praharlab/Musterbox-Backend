const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const Site = require('./site');
const BranchMaster = require('./branchMaster');
const table_name = 'project';

const Project = sequelize.define(
  table_name,
  {
    projectID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    projectName: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    display_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    short_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    projectDescription: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    deactiveDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    branchMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    siteID: {
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
  { paranoid: true }
);

Project.addHook('beforeCreate', (project, options) => {
  project.createBy = options.user.userMasterId;
  project.createByIp = options.user.userIpAddress;
});

Project.addHook('beforeUpdate', (project, options) => {
  project.updateBy = options.user.userMasterId;
  project.updateByIp = options.user.userIpAddress;
});

Project.addHook('beforeDestroy', (project, options) => {
  project.deleteBy = options.user.userMasterId;
  project.deleteByIp = options.user.userIpAddress;
});

Project.belongsTo(companyMaster, { foreignKey: { name: 'companyMasterID' } });

Project.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

Project.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

Project.belongsTo(UserMaster, {
  as: 'deleteByUserDetails',
  foreignKey: { name: 'deleteBy' },
});
Project.belongsTo(BranchMaster, {
  foreignKey: { name: 'branchMasterID' },
});
Project.belongsTo(Site, {
  foreignKey: { name: 'siteID' },
});
module.exports = Project;
