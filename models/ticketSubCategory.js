const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const TicketCategory = require('./ticketCategory');
const UserMaster = require('./userMaster');

const TicketSubCategory = sequelize.define(
  'ticketSubCategory',
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
TicketSubCategory.belongsTo(TicketCategory, {
  foreignKey: { name: 'ticketCategoryId' },
  keyType: Sequelize.BIGINT,
});
TicketCategory.hasMany(TicketSubCategory);
TicketSubCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'defaultAssignee' },
});
TicketSubCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
TicketSubCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
TicketSubCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

TicketSubCategory.addHook('beforeCreate', (category, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  category.createBy = options.user.userMasterId;
  category.updateBy = options.user.userMasterId;
  category.createByIp = options.user.userIpAddress;
  category.updateByIp = options.user.userIpAddress;
});

TicketSubCategory.addHook('beforeUpdate', (category, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  category.updateBy = options.user.userMasterId;
  category.updateByIp = options.user.userIpAddress;
});

TicketSubCategory.addHook('beforeDestroy', (category, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  category.deleteBy = options.user.userMasterId;
  category.deleteByIp = options.user.userIpAddress;
});
module.exports = TicketSubCategory;
