const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'preboardingMaster';
const CompanyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');

const PreboardingMaster = sequelize.define(table_name, {
  preboardingMasterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  preboardingMasterName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  preboardingMasterDescription: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  jobDescription: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  secretKey: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.BIGINT,
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
  },
  updateByIp: {
    type: Sequelize.STRING,
  },
});

PreboardingMaster.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

PreboardingMaster.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

PreboardingMaster.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

PreboardingMaster.addHook('beforeCreate', (data, options) => {
  data.createBy = options.user.userMasterId;
  data.createByIp = options.user.userIpAddress;
});

PreboardingMaster.addHook('beforeUpdate', (data, options) => {
  data.updateBy = options.user.userMasterId;
  data.updateByIp = options.user.userIpAddress;
});

PreboardingMaster.addHook('beforeDestroy', (data, options) => {
  data.deleteBy = options.user.userMasterId;
  data.deleteByIp = options.user.userIpAddress;
});

PreboardingMaster.addHook('beforeBulkCreate', (data, options) => {
  data.forEach((answer) => {
    answer.createBy = options.user.userMasterId;
    answer.createByIp = options.user.userIpAddress;
  });
});
module.exports = PreboardingMaster;
