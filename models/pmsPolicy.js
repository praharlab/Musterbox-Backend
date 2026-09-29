const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const { PmsPolicyEnum } = require('../utils/dbUtils');

const PmsPolicy = sequelize.define(
  'pmsPolicy',
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    goalType: {
      type: Sequelize.ENUM(...Object.values(PmsPolicyEnum)),
      allowNull: false,
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

PmsPolicy.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterId', allowNull: false },
});

PmsPolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
PmsPolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
PmsPolicy.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

PmsPolicy.addHook('beforeCreate', (goal, options) => {
  // Set createdBy, updatedBy, and ipAddress based on the authenticated user
  goal.createBy = options.user.userMasterId;
  goal.updateBy = options.user.userMasterId;
  goal.createByIp = options.user.userIpAddress;
  goal.updateByIp = options.user.userIpAddress;
});

PmsPolicy.addHook('beforeUpdate', (goal, options) => {
  // Set updatedBy and ipAddress based on the authenticated user
  goal.updateBy = options.user.userMasterId;
  goal.updateByIp = options.user.userIpAddress;
});

PmsPolicy.addHook('beforeDestroy', (goal, options) => {
  // Set deletedBy and ipAddress based on the authenticated user
  goal.deleteBy = options.user.userMasterId;
  goal.deleteByIp = options.user.userIpAddress;
});

module.exports = PmsPolicy;
