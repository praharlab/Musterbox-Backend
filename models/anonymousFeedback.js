const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const table_name = 'anonymousFeedback';
const AnonymousFeedback = sequelize.define(
  table_name,
  {
    AnonymousFeedbackID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    feedback: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
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
AnonymousFeedback.addHook('beforeCreate', (anonymousFeedback, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  anonymousFeedback.createBy = options.user.userMasterId;
  anonymousFeedback.updateBy = options.user.userMasterId;
  anonymousFeedback.createByIp = options.user.userIpAddress;
  anonymousFeedback.updateByIp = options.user.userIpAddress;
});

AnonymousFeedback.addHook('beforeUpdate', (anonymousFeedback, options) => {
  anonymousFeedback.updateBy = options.user.userMasterId;
  anonymousFeedback.ipAddress = options.user.userIpAddress;
  anonymousFeedback.updateByIp = options.user.userIpAddress;
});

AnonymousFeedback.addHook('beforeDestroy', (anonymousFeedback, options) => {
  anonymousFeedback.deleteBy = options.user.userMasterId;
  anonymousFeedback.deleteByIp = options.user.userIpAddress;
});

AnonymousFeedback.belongsTo(userMaster, {
  foreignKey: { name: 'userMasterID' },
});
// userMaster.hasMany(AnonymousFeedback, { foreignKey: { name: 'userMasterID' } });
module.exports = AnonymousFeedback;
