const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const table_name = 'terminationLetter';

const TerminationLetter = sequelize.define(
  table_name,
  {
    terminationLetterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    terminationLetterName: {
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

TerminationLetter.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

TerminationLetter.addHook('beforeCreate', (terminationLetter, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  terminationLetter.createBy = options.user.userMasterId;
  terminationLetter.updateBy = options.user.userMasterId;
  terminationLetter.createByIp = options.user.userIpAddress;
  terminationLetter.updateByIp = options.user.userIpAddress;
});

TerminationLetter.addHook('beforeUpdate', (terminationLetter, options) => {
  terminationLetter.updateBy = options.user.userMasterId;
  terminationLetter.ipAddress = options.user.userIpAddress;
  terminationLetter.updateByIp = options.user.userIpAddress;
});

TerminationLetter.addHook('beforeDestroy', (terminationLetter, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  terminationLetter.deleteBy = options.user.userMasterId;
  terminationLetter.deleteByIp = options.user.userIpAddress;
});

module.exports = TerminationLetter;
