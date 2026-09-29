const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { DatabaseOperationEnum } = require('../utils/dbUtils');

const UserActivity = sequelize.define('userActivity', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  activityType: {
    type: Sequelize.ENUM(...Object.values(DatabaseOperationEnum)),
    allowNull: false,
  },
  activityTable: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  activityTablePK: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  activityDetails: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  activityTime: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
});
UserActivity.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterId' },
});
UserActivity.addHook('beforeCreate', (userActivity, options) => {
  userActivity.userMasterId = options.userMasterId;
});
module.exports = UserActivity;
