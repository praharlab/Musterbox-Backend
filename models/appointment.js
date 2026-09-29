const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const table_name = 'appointmentLetter';

const AppointmentLetter = sequelize.define(
  table_name,
  {
    appointmentLetterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    appointmentLetterName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    letterTemplate: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    letterHead: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.INTEGER,
    },
    updateBy: {
      type: Sequelize.INTEGER,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  {
    paranoid: true,
  }
);

AppointmentLetter.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

AppointmentLetter.addHook('beforeCreate', (appointmentLetter, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  appointmentLetter.createBy = options.user.userMasterId;
  appointmentLetter.updateBy = options.user.userMasterId;
  appointmentLetter.createByIp = options.user.userIpAddress;
  appointmentLetter.updateByIp = options.user.userIpAddress;
});

AppointmentLetter.addHook('beforeUpdate', (appointmentLetter, options) => {
  appointmentLetter.updateBy = options.user.userMasterId;
  appointmentLetter.ipAddress = options.user.userIpAddress;
  appointmentLetter.updateByIp = options.user.userIpAddress;
});

AppointmentLetter.addHook('beforeDestroy', (appointmentLetter, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  appointmentLetter.deleteBy = options.user.userMasterId;
  appointmentLetter.deleteByIp = options.user.userIpAddress;
});

module.exports = AppointmentLetter;
