const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const table_name = 'weekOffShuffle';
const WeekOffShuffle = sequelize.define(
  table_name,
  {
    weekoffShuffleId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    //forgeinKey
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    weekoffShuffled: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    shuffled: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
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

WeekOffShuffle.addHook('beforeCreate', (weekoffShuffle, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  weekoffShuffle.createBy = options.user.userMasterId;
  weekoffShuffle.updateBy = options.user.userMasterId;
  weekoffShuffle.createByIp = options.user.userIpAddress;
  weekoffShuffle.updateByIp = options.user.userIpAddress;
});

WeekOffShuffle.addHook('beforeUpdate', (weekoffShuffle, options) => {
  weekoffShuffle.updateBy = options.user.userMasterId;
  weekoffShuffle.ipAddress = options.user.userIpAddress;
  weekoffShuffle.updateByIp = options.user.userIpAddress;
});

WeekOffShuffle.addHook('beforeDestroy', (weekoffShuffle, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  weekoffShuffle.deleteBy = options.user.userMasterId;
  weekoffShuffle.deleteByIp = options.user.userIpAddress;
});
WeekOffShuffle.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
UserMaster.hasMany(WeekOffShuffle, {
  foreignKey: { name: 'userMasterID' },
});
module.exports = WeekOffShuffle;
