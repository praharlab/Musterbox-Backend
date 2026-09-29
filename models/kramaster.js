const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const GoalMaster = require('./goalMaster');

const KRAMaster = sequelize.define(
  'kraMaster',
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
    description: {
      type: Sequelize.TEXT,
    },
    weightage: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deletedByIp: {
      type: Sequelize.STRING,
    },
  },
  { paranoid: true }
);

KRAMaster.belongsTo(GoalMaster, {
  foreignKey: { name: 'goalMasterId', allowNull: false },
});
GoalMaster.hasMany(KRAMaster);

KRAMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
KRAMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
KRAMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

KRAMaster.addHook('beforeCreate', (kra, options) => {
  // Set createdBy, updatedBy, and ipAddress based on the authenticated user
  kra.createBy = options.user.userMasterId;
  kra.updateBy = options.user.userMasterId;
  kra.createByIp = options.user.userIpAddress;
  kra.updateByIp = options.user.userIpAddress;
});

KRAMaster.addHook('beforeUpdate', (kra, options) => {
  // Set updatedBy and ipAddress based on the authenticated user
  kra.updateBy = options.user.userMasterId;
  kra.updateByIp = options.user.userIpAddress;
});

KRAMaster.addHook('beforeDestroy', (kra, options) => {
  // Set deletedBy and ipAddress based on the authenticated user
  kra.deleteBy = options.user.userMasterId;
  kra.deleteByIp = options.user.userIpAddress;
});

module.exports = KRAMaster;
