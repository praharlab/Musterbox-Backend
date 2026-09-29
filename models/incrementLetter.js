const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const table_name = 'incrementLetter';

const IncrementLetter = sequelize.define(
  table_name,
  {
    incrementLetterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    incrementLetterName: {
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

IncrementLetter.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

IncrementLetter.addHook('beforeCreate', (incrementLetter, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  incrementLetter.createBy = options.user.userMasterId;
  incrementLetter.updateBy = options.user.userMasterId;
  incrementLetter.createByIp = options.user.userIpAddress;
  incrementLetter.updateByIp = options.user.userIpAddress;
});

IncrementLetter.addHook('beforeUpdate', (incrementLetter, options) => {
  incrementLetter.updateBy = options.user.userMasterId;
  incrementLetter.ipAddress = options.user.userIpAddress;
  incrementLetter.updateByIp = options.user.userIpAddress;
});

IncrementLetter.addHook('beforeDestroy', (incrementLetter, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  incrementLetter.deleteBy = options.user.userMasterId;
  incrementLetter.deleteByIp = options.user.userIpAddress;
});

module.exports = IncrementLetter;
