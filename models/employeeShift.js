const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Shift = require('./shift');
const table_name = 'employeeShift';
const EmployeeShift = sequelize.define(
  table_name,
  {
    employeeShiftID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    shiftID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    shiftsID: {
      type: Sequelize.ARRAY(Sequelize.BIGINT),
      allowNull: true,
    },
    startDate: {
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
        fields: ['startDate'],
      },
      {
        unique: false,
        fields: ['endDate'],
      },
      {
        unique: false,
        fields: ['shiftID'],
      },
    ],
  }
);

EmployeeShift.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeShift.belongsTo(Shift, {
  as: 'shift',
  foreignKey: { name: 'shiftID' },
});

UserMaster.hasMany(EmployeeShift, {
  foreignKey: { name: 'userMasterID' },
});
EmployeeShift.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});
EmployeeShift.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
module.exports = EmployeeShift;
