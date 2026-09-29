const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'preboardingRequest';
const preboarding = require('./preboarding');
const usermaster = require('./userMaster');
const UserMaster = require('./userMaster');

const PreboardingRequest = sequelize.define(table_name, {
  preboardingRequestID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  preboardingID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  remarks: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  requeststatus: {
    type: Sequelize.STRING,
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
});

PreboardingRequest.belongsTo(preboarding, {
  foreignKey: { name: 'preboardingID' },
});
PreboardingRequest.belongsTo(usermaster, {
  foreignKey: { name: 'userMasterID' },
});

PreboardingRequest.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

PreboardingRequest.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

PreboardingRequest.addHook('beforeCreate', (data, options) => {
  data.createBy = options.user.userMasterId;
  data.createByIp = options.user.userIpAddress;
});

PreboardingRequest.addHook('beforeUpdate', (data, options) => {
  data.updateBy = options.user.userMasterId;
  data.updateByIp = options.user.userIpAddress;
});

PreboardingRequest.addHook('beforeDestroy', (data, options) => {
  data.deleteBy = options.user.userMasterId;
  data.deleteByIp = options.user.userIpAddress;
});

PreboardingRequest.addHook('beforeBulkCreate', (data, options) => {
  data.forEach((answer) => {
    answer.createBy = options.user.userMasterId;
    answer.createByIp = options.user.userIpAddress;
  });
});


module.exports = PreboardingRequest;
