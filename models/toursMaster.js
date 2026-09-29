const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const CompanyMaster = require('./companyMaster');

const table_name = 'ToursMaster';

const toursMaster = sequelize.define(table_name, {
  ToursMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  ToursName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  FromDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  ToDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  TotalDays: {
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
  CoPersonId: {
    type: Sequelize.ARRAY(Sequelize.BIGINT),
    allowNull: true,
  },
  Description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  UserMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  authorizationStatus: {
    type: Sequelize.BIGINT,
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
  createByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

toursMaster.belongsTo(UserMaster, {
  as: 'assign',
  foreignKey: { name: 'UserMasterID' },
});

toursMaster.belongsTo(UserMaster, {
  as: 'createByUser',
  foreignKey: { name: 'createBy' },
});

toursMaster.belongsTo(UserMaster, {
  as: 'updateByUser',
  foreignKey: { name: 'updateBy' },
});

module.exports = toursMaster;
