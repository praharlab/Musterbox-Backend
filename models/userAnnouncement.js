const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Announcement = require('./announcement');
const table_name = 'userAnnouncements';
const UserAnnouncement = sequelize.define(table_name, {
  userAnnouncementID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  announcementID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  readstatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

UserAnnouncement.belongsTo(Announcement, {
  foreignKey: { name: 'announcementID' },
});
UserAnnouncement.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = UserAnnouncement;
