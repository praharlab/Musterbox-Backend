const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const WeekOffPolicy = require('./weekOffPolicy');
const table_name = 'employeeWeekOff';
const EmployeeWeekOff = sequelize.define(
  table_name,
  {
    employeeWeekOffID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    weekOffPolicyID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    applicableDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DATEONLY,
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['applicableDate'],
      },
      {
        unique: false,
        fields: ['weekOffPolicyID'],
      },
    ],
  }
);

EmployeeWeekOff.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeWeekOff.belongsTo(WeekOffPolicy, {
  as: 'weekoff',
  foreignKey: { name: 'weekOffPolicyID' },
});
UserMaster.hasMany(EmployeeWeekOff, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeWeekOff.belongsTo(UserMaster,{
  as: 'createdByUserDetails',
  foreignKey: {name: 'createBy'},
});

EmployeeWeekOff.belongsTo(UserMaster,{
  as: 'updatedByUserDetails',
  foreignKey: {name: 'updateBy'},
});

module.exports = EmployeeWeekOff;
