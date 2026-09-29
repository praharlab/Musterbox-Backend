const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'dailyTask';
const UserMaster = require('./userMaster');
const DailyTask = sequelize.define(table_name, {
  dailyTaskID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    //forign key
  },
  taskDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  taskDesc: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  attachment: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  attachments: {
    type: Sequelize.ARRAY(Sequelize.TEXT),
  },
});

DailyTask.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = DailyTask;
