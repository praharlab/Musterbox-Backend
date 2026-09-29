const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'callFollowup';
const UserMaster = require('./userMaster');
const CustomerMaster = require('./customer');

const CallFollowup = sequelize.define(table_name, {
  callFollowUpID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  visitID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  customerCompanyID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  contactPersonName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  contactPersonNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  callDateTime: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  estimatedTime: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  remarks: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  callFollowUpStatus: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.BIGINT,
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
});

CallFollowup.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
CallFollowup.belongsTo(CustomerMaster, {
  foreignKey: { name: 'customerCompanyID' },
});

module.exports = CallFollowup;
