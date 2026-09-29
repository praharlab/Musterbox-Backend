const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const TicketCategory = require('./ticketCategory');
const TicketSubCategory = require('./ticketSubCategory');
const {
  TicketStatusEnum,
  TicketPriorityEnum,
  DatabaseOperationEnum,
} = require('../utils/dbUtils');
const UserActivity = require('./userActivity');

const Ticket = sequelize.define(
  'ticket',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    status: {
      type: Sequelize.ENUM(...Object.values(TicketStatusEnum)),
      defaultValue: TicketStatusEnum.CREATED,
    },
    priority: {
      type: Sequelize.ENUM(...Object.values(TicketPriorityEnum)),
      defaultValue: TicketPriorityEnum.MEDIUM,
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
Ticket.belongsTo(TicketCategory, {
  foreignKey: { name: 'ticketCategoryId' },
  keyType: Sequelize.BIGINT,
});
Ticket.belongsTo(TicketSubCategory, {
  foreignKey: { name: 'ticketSubCategoryId' },
  keyType: Sequelize.BIGINT,
});
TicketSubCategory.hasMany(Ticket);
TicketCategory.hasMany(Ticket);
Ticket.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'ticketCreatedBy',
});
Ticket.belongsTo(UserMaster, {
  foreignKey: { name: 'assignee' },
  as: 'ticketAssignedTo',
});
Ticket.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
Ticket.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

Ticket.addHook('beforeCreate', (ticket, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  ticket.createBy = options.user.userMasterId;
  ticket.updateBy = options.user.userMasterId;
  ticket.createByIp = options.user.userIpAddress;
  ticket.updateByIp = options.user.userIpAddress;
});

Ticket.addHook('beforeUpdate', async (ticket, options) => {
  const oldValue = ticket.previous();
  const newValue = ticket.toJSON();
  if (Object.keys(oldValue).length > 0) {
    const trackedData = {
      activityType: DatabaseOperationEnum.UPDATE,
      activityTable: Ticket.getTableName(),
      activityTablePK: newValue.id,
      activityDetails: [],
    };
    Object.keys(oldValue).forEach((key) => {
      if (newValue.hasOwnProperty(key)) {
        const newObject = {};
        newObject[`new_${key}`] = newValue[key];
        newObject[`old_${key}`] = oldValue[key];
        trackedData.activityDetails.push(newObject);
      }
    });
    await UserActivity.create(trackedData, {
      userMasterId: options.user.userMasterId,
      transaction: options.transaction,
    });
  }
  // Set updatedBy and ipAddress based on the authenticated user
  ticket.updateBy = options.user.userMasterId;
  ticket.updateByIp = options.user.userIpAddress;
});

Ticket.addHook('beforeDestroy', (ticket, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  ticket.deleteBy = options.user.userMasterId;
  ticket.deleteByIp = options.user.userIpAddress;
});

module.exports = Ticket;
