const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const table_name = 'userChats';
const UserChats = sequelize.define(table_name, {
  userChatsID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  senderID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  receiverID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  message: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  path: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  msgstatus: {
    type: Sequelize.INTEGER, //0-failed 1-sent 2-viewed
    allowNull: false,
  },
  status: {
    type: Sequelize.INTEGER, //0-deleted 1-not_deleted
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
});

UserChats.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = UserChats;
