const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { notificationCronTypes } = require('../utils/dbUtils');

const NotificationCrons = sequelize.define('notificationCrons', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: Sequelize.ENUM(...Object.values(notificationCronTypes)),
    required: true,
  },
  time: { type: Sequelize.TIME },
  date: { type: Sequelize.DATEONLY },
  users: { type: Sequelize.ARRAY(Sequelize.BIGINT) },
  metadata: { type: Sequelize.JSON },
  cronExpression: { type: Sequelize.STRING },
  status: { type: Sequelize.STRING, defaultValue: 'SCHEDULED' },
  createByIp: {
    type: Sequelize.STRING,
  },
  updateByIp: {
    type: Sequelize.STRING,
  },
  deleteByIp: {
    type: Sequelize.STRING,
  },
});

module.exports = NotificationCrons;
