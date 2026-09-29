const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const AttendanceTransaction = require('../models/attendanceTransaction');
const table_name = 'attendancelogs';

const AttendanceLogs = sequelize.define(
  table_name,
  {
    attendanceLogID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    //foreig key
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    logDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    direction: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    photo: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    attendnaceFrom: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    longitude: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    latitude: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    AttendanceTransID: {
      type: Sequelize.BIGINT,
      allowNull: true,
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
        fields: ['attendanceLogID'],
      },
      {
        unique: false,
        fields: ['logDateTime'],
      },
    ],
  }
);

AttendanceLogs.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
AttendanceLogs.belongsTo(AttendanceTransaction, {
  foreignKey: { name: 'AttendanceTransID' },
});

AttendanceTransaction.hasMany(AttendanceLogs, {
  foreignKey: { name: 'AttendanceTransID' },
});

UserMaster.hasMany(AttendanceLogs, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = AttendanceLogs;
