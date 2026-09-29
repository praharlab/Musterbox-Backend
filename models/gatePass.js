const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const meetingPlace = require('./meetingPlace');
const UserMaster = require('./userMaster');
const visitors = require('./visitors');
const table_name = 'gatePasses';
const gatePass = sequelize.define(table_name, {
  gatePassid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  visitorsid: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: true,
    //forign key
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: true,
    //forign key
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: true,
    //forign key
  },
  inTime: {
    type: Sequelize.STRING,
    allowNull: true,
    //forign key
  },
  outTime: {
    type: Sequelize.STRING,
    allowNull: true,
    //forign key
  },
  fromTime: {
    type: Sequelize.STRING,
    allowNull: true,
    //forign key
  },
  toTime: {
    type: Sequelize.STRING,
    allowNull: true,
    //forign key
  },
  meetingPlaceID: {
    type: Sequelize.INTEGER,
    allowNull: true,
    //forign key
  },
  remarks: {
    type: Sequelize.TEXT,
    allowNull: true,
    //forign key
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: true,
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
  attachment: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  checkINattachment: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  checkOUTattachment: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  visitortype: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  vehicleNo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  noofperson: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  personName: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
  personNumber: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
});

gatePass.belongsTo(CompanyMaster, { foreignKey: { name: 'companyMasterID' } });
gatePass.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
gatePass.belongsTo(meetingPlace, { foreignKey: { name: 'meetingPlaceID' } });
gatePass.belongsTo(visitors, { foreignKey: { name: 'visitorsid' } });

module.exports = gatePass;
