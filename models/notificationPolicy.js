const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const table_name = 'NotificationPolicy';
const notificationPolicy = sequelize.define(table_name, {
  notificationPolicyID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  secure: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  hostmail: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'smtp.gmail.com',
  },
  port: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 5432,
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

notificationPolicy.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
// CompanyMaster.hasMany(notificationPolicy, {
//   foreignKey: { name: 'companyMasterID' },
// });
module.exports = notificationPolicy;
