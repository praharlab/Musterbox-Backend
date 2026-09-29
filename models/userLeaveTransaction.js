const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'userLeaveTransaction';
const hrLeaveTypes = require('./hrLeaveTypes');
const leaveauthorization = require('./leaveAuthorization');
const UserLeave = require('./userleave');
const UserMaster = require('./userMaster');
const UserLeaveTransaction = sequelize.define(table_name, {
  userLeaveTransactionID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  ReferenceID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  leaveAuthID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  LeaveTranId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  days: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  date: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  issandwichleave: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  LeaveCancelRemark: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

UserLeaveTransaction.belongsTo(hrLeaveTypes, {
  foreignKey: { name: 'LeaveTranId' },
});
UserLeaveTransaction.belongsTo(leaveauthorization, {
  foreignKey: { name: 'leaveAuthID' },
});
UserLeaveTransaction.belongsTo(UserLeave, {
  foreignKey: { name: 'ReferenceID' },
});

UserLeave.hasMany(UserLeaveTransaction, {
  foreignKey: { name: 'ReferenceID' },
});
UserLeaveTransaction.belongsTo(UserMaster, {
  as: "createByUser",
  foreignKey: { name: "createBy" },
});

UserLeaveTransaction.belongsTo(UserMaster, {
  as: "updateByUser",
  foreignKey: { name: "updateBy" },
});
module.exports = UserLeaveTransaction;
