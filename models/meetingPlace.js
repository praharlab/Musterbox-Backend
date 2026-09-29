const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const table_name = 'meetingPlace';
const meetingPlace = sequelize.define(table_name, {
  meetingPlaceid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  meetingPlaceName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
    //forign key
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

meetingPlace.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = meetingPlace;
