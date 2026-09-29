const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CheckList = require('./checklist');
const UserMaster = require('./userMaster');
const table_name = 'userChecklist';

const UserChecklist = sequelize.define(table_name, {
  userChecklistID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  checkListID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  filledChecklistQID: {
    type: Sequelize.ARRAY(Sequelize.INTEGER),
    allowNull: true,
  },
  filledChecklistQDate: {
    type: Sequelize.ARRAY(Sequelize.DATE),
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: false,
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

UserChecklist.belongsTo(CheckList, { foreignKey: { name: 'checkListID' } });
UserChecklist.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = UserChecklist;
