const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const Department = require('./employeeDepartment');
const Designation = require('./employeeDesignation');
const table_name = 'userTracking';

const UserTracking = sequelize.define(
  table_name,
  {
    userTrackingID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    trackingTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    trackStatus: {
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
    statusMonitoring: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    notifyReportTo: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
        fields: ['companyMasterID'],
      },
      {
        unique: false,
        fields: ['trackStatus'],
      },
    ],
  }
);

UserTracking.belongsTo(UserMaster, {
  as: 'user',
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(UserTracking, {
  as: 'userTracking',
  foreignKey: { name: 'userMasterID' },
});

UserTracking.belongsTo(companyMaster, {
  as: 'company',
  foreignKey: { name: 'companyMasterID' },
});

module.exports = UserTracking;
