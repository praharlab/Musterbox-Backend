const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const companyMaster = require('./companyMaster');

const UserInbox = sequelize.define('userInbox', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  // Store table for which request is created
  activityTable: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  // Store id of request record
  activityTablePK: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  message: { type: Sequelize.TEXT, allowNull: false },
  companyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
});

UserInbox.belongsTo(UserMaster, {
  foreignKey: { name: 'assignedTo' },
  as: 'requestAssignedTo',
});
UserInbox.belongsTo(UserMaster, {
  foreignKey: { name: 'assignedBy' },
  as: 'requestAssignedBy',
});
UserInbox.belongsTo(companyMaster, {
  foreignKey: { name: "companyMasterID" },
});
module.exports = UserInbox;
