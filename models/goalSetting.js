const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const userMaster = require('./userMaster');

const GoalSetting = sequelize.define(
  'goalSetting',
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING(30),
      validate: { max: 30 },
      allowNull: false,
    },
    grade: {
      type: Sequelize.JSON,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
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
  { paranoid: true }
);

GoalSetting.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterId', allowNull: false },
});
GoalSetting.belongsTo(userMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
GoalSetting.belongsTo(userMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
GoalSetting.belongsTo(userMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

GoalSetting.addHook('beforeCreate', (setting, options) => {
  // Set createdBy, updatedBy, and ipAddress based on the authenticated user
  setting.createBy = options.user.userMasterId;
  setting.updateBy = options.user.userMasterId;
  setting.createByIp = options.user.userIpAddress;
  setting.updateByIp = options.user.userIpAddress;
});

GoalSetting.addHook('beforeUpdate', (setting, options) => {
  // Set updatedBy and ipAddress based on the authenticated user
  setting.updateBy = options.user.userMasterId;
  setting.updateByIp = options.user.userIpAddress;
});

GoalSetting.addHook('beforeDestroy', (setting, options) => {
  // Set deletedBy and ipAddress based on the authenticated user
  setting.deleteBy = options.user.userMasterId;
  setting.deleteByIp = options.user.userIpAddress;
});

module.exports = GoalSetting;
