const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { SentimentMoodEnum } = require('../utils/dbUtils');

const SentimentPunchIn = sequelize.define(
  'sentimentPunchIn',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    mood: {
      type: Sequelize.ENUM(...Object.values(SentimentMoodEnum)),
      required: true,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
  },
  { paranoid: true }
);

SentimentPunchIn.belongsTo(UserMaster, { foreignKey: 'userMasterId' });

SentimentPunchIn.addHook('beforeCreate', (sentimentPunchIn, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  sentimentPunchIn.userMasterId = options.user.userMasterId;
  sentimentPunchIn.createByIp = options.user.userIpAddress;
});

module.exports = SentimentPunchIn;
