const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const HolidayPolicy = require('./holidayPolicy');
const table_name = 'employeeHolidayPolicy';
const employeeHolidayPolicy = sequelize.define(table_name, {
  employeeholidayPolicyID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  holidayPolicyID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  applicableDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATE,
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

employeeHolidayPolicy.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
employeeHolidayPolicy.belongsTo(HolidayPolicy, {
  as: 'HolidayPolicy',
  foreignKey: { name: 'holidayPolicyID' },
});
UserMaster.hasMany(employeeHolidayPolicy, {
  foreignKey: { name: 'userMasterID' },
});

employeeHolidayPolicy.belongsTo(UserMaster,{
  as: 'createdByUserDetails',
  foreignKey: {name: 'createBy'}
});

employeeHolidayPolicy.belongsTo(UserMaster,{
  as: 'updatedByUserDetails',
  foreignKey: {name: 'updateBy'}
});


module.exports = employeeHolidayPolicy;
