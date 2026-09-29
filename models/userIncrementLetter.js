const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const IncrementLetter = require('./incrementLetter');
const table_name = 'userIncrementLetter';
const UserIncrementLetter = sequelize.define(
  table_name,
  {
    userincrementLetterID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    incrementLetterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    incrementLetter: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    incrementletterHTML: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    oldSalaryStructure: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    newSalaryStructure: {
      type: Sequelize.TEXT,
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

UserIncrementLetter.addHook('beforeCreate', (userIncrementLetter, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  userIncrementLetter.createBy = options.user.userMasterId;
  userIncrementLetter.updateBy = options.user.userMasterId;
  userIncrementLetter.createByIp = options.user.userIpAddress;
  userIncrementLetter.updateByIp = options.user.userIpAddress;
});

UserIncrementLetter.addHook('beforeUpdate', (userIncrementLetter, options) => {
  userIncrementLetter.updateBy = options.user.userMasterId;
  userIncrementLetter.ipAddress = options.user.userIpAddress;
  userIncrementLetter.updateByIp = options.user.userIpAddress;
});

UserIncrementLetter.addHook('beforeDestroy', (userIncrementLetter, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  userIncrementLetter.deleteBy = options.user.userMasterId;
  userIncrementLetter.deleteByIp = options.user.userIpAddress;
});

UserIncrementLetter.belongsTo(userMaster, {
  foreignKey: { name: 'userMasterID' },
});
UserIncrementLetter.belongsTo(IncrementLetter, {
  foreignKey: { name: 'incrementLetterID' },
  as: 'IncrementLetter',
});

module.exports = UserIncrementLetter;
