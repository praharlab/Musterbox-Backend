const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const table_name = 'experienceLetter';

const ExperienceLetter = sequelize.define(
  table_name,
  {
    experienceLetterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    experienceLetterName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    letterTemplate: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    letterHead: {
      type: Sequelize.STRING,
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
  }
);

ExperienceLetter.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

ExperienceLetter.addHook('beforeCreate', (experienceLetter, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  experienceLetter.createBy = options.user.userMasterId;
  experienceLetter.updateBy = options.user.userMasterId;
  experienceLetter.createByIp = options.user.userIpAddress;
  experienceLetter.updateByIp = options.user.userIpAddress;
});

ExperienceLetter.addHook('beforeUpdate', (experienceLetter, options) => {
  experienceLetter.updateBy = options.user.userMasterId;
  experienceLetter.ipAddress = options.user.userIpAddress;
  experienceLetter.updateByIp = options.user.userIpAddress;
});

ExperienceLetter.addHook('beforeDestroy', (experienceLetter, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  experienceLetter.deleteBy = options.user.userMasterId;
  experienceLetter.deleteByIp = options.user.userIpAddress;
});

module.exports = ExperienceLetter;
