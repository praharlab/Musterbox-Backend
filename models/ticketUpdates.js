const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Ticket = require('./ticket');

const TicketUpdates = sequelize.define(
  'ticketUpdates',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    message: {
      type: Sequelize.TEXT,
    },
    attachments: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
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
TicketUpdates.belongsTo(Ticket, {
  foreignKey: { name: 'ticketId' },
  keyType: Sequelize.BIGINT,
});
Ticket.hasMany(TicketUpdates);
TicketUpdates.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
});

TicketUpdates.addHook('beforeCreate', (ticketUpdates, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  ticketUpdates.createBy = options.user.userMasterId;
  ticketUpdates.updateBy = options.user.userMasterId;
  ticketUpdates.createByIp = options.user.userIpAddress;
  ticketUpdates.updateByIp = options.user.userIpAddress;
});

TicketUpdates.addHook('beforeUpdate', (ticketUpdates, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  ticketUpdates.updateBy = options.user.userMasterId;
  ticketUpdates.updateByIp = options.user.userIpAddress;
});

TicketUpdates.addHook('beforeDestroy', (ticketUpdates, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  ticketUpdates.deleteBy = options.user.userMasterId;
  ticketUpdates.deleteByIp = options.user.userIpAddress;
});

module.exports = TicketUpdates;
