const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'holidayList';
const HolidayPolicyMaster = require('./holidayPolicy');
const holidayList = sequelize.define(table_name, {
  holidayListID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  holidayListName: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
  },
  holidayDate: {
    type: Sequelize.ARRAY(Sequelize.DATE),
    allowNull: false,
  },
  holidayPolicyID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: Sequelize.BIGINT,
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
  optionalHoliday: {
    type: Sequelize.ARRAY(Sequelize.BOOLEAN),
    allowNull: true,
  },
});

holidayList.belongsTo(HolidayPolicyMaster, {
  foreignKey: { name: 'holidayPolicyID' },
});
HolidayPolicyMaster.hasMany(holidayList, {
  foreignKey: { name: 'holidayPolicyID' },
});
module.exports = holidayList;
