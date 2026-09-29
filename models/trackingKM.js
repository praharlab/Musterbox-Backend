const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Tracking = require('./tracking');
const table_name = 'TrackingKM';

const TrackingKM = sequelize.define(table_name, {
  //primary key
  TrackingKMID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  //foreign key
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  Lattitude: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Longitude: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  kilometer: {
    type: Sequelize.FLOAT,
    allowNull: true,
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
  Status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  Address: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Track_datetime: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  Battery: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Gps: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Wifi: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Mobile_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  type: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  developerMode: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'off',
  },
  geofence: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

TrackingKM.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
TrackingKM.belongsTo(Tracking, { foreignKey: { name: 'UserTrackingID' } });

module.exports = TrackingKM;
