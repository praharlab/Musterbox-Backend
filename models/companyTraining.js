const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const table_name = 'companyTraining';
const CompanyTraining = sequelize.define(
  table_name,
  {
    companyTrainingID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    //forgein Key
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    trainingDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    startTrainingTiming: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    endTrainingTiming: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    trainingTakenBy: {
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

CompanyTraining.addHook('beforeCreate', (companyTraining, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  companyTraining.createBy = options.user.userMasterId;
  companyTraining.updateBy = options.user.userMasterId;
  companyTraining.createByIp = options.user.userIpAddress;
  companyTraining.updateByIp = options.user.userIpAddress;
});

CompanyTraining.addHook('beforeUpdate', (companyTraining, options) => {
  companyTraining.updateBy = options.user.userMasterId;
  companyTraining.ipAddress = options.user.userIpAddress;
  companyTraining.updateByIp = options.user.userIpAddress;
});

CompanyTraining.addHook('beforeDestroy', (companyTraining, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  companyTraining.deleteBy = options.user.userMasterId;
  companyTraining.deleteByIp = options.user.userIpAddress;
});

CompanyTraining.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
CompanyTraining.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdBy',
});
CompanyTraining.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedBy',
});

module.exports = CompanyTraining;
