const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const companyMaster = require('./companyMaster');

const TicketCategory = sequelize.define(
  'ticketCategory',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(30),
      validate: { max: 30 },
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    createBy: {
      type: Sequelize.INTEGER,
    },
    updateBy: {
      type: Sequelize.INTEGER,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
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
TicketCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'defaultAssignee' },
});
TicketCategory.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterId' },
});
TicketCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
TicketCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
TicketCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

TicketCategory.addHook('beforeCreate', (category, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  category.createBy = options.user.userMasterId;
  category.updateBy = options.user.userMasterId;
  category.createByIp = options.user.userIpAddress;
  category.updateByIp = options.user.userIpAddress;
});

TicketCategory.addHook('beforeUpdate', (category, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  category.updateBy = options.user.userMasterId;
  category.ipAddress = options.user.userIpAddress;
  category.updateByIp = options.user.userIpAddress;
});

TicketCategory.addHook('beforeDestroy', (category, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  category.deleteBy = options.user.userMasterId;
  category.deleteByIp = options.user.userIpAddress;
});
module.exports = TicketCategory;
