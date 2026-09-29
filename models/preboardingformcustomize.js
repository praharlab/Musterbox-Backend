const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'preboardingFormCustomize';
const CompanyMaster = require('./companyMaster');
const PreboardingMaster = require('./preboardingMaster');
const UserMaster = require('./userMaster');

const PreboardingFormCustomize = sequelize.define(table_name, {
  preboardingFormCustomizeID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  fieldLabel: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  inputType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  value: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
  mousehovermessage: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  isRequired: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.BIGINT,
  },
  updateBy: {
    type: Sequelize.BIGINT,
  },
  createByIp: {
    type: Sequelize.STRING,
  },
  updateByIp: {
    type: Sequelize.STRING,
  },
  sortingindex: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

PreboardingFormCustomize.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
PreboardingFormCustomize.belongsTo(PreboardingMaster, {
  foreignKey: { name: 'preboardingMasterID' },
});


PreboardingFormCustomize.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

PreboardingFormCustomize.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});


PreboardingFormCustomize.addHook('beforeCreate', (data, options) => {
  data.createBy = options.user.userMasterId;
  data.createByIp = options.user.userIpAddress;
});

PreboardingFormCustomize.addHook('beforeUpdate', (data, options) => {
  data.updateBy = options.user.userMasterId;
  data.updateByIp = options.user.userIpAddress;
});

PreboardingFormCustomize.addHook('beforeDestroy', (data, options) => {
  data.deleteBy = options.user.userMasterId;
  data.deleteByIp = options.user.userIpAddress;
});

PreboardingFormCustomize.addHook('beforeBulkCreate', (data, options) => {
  data.forEach((answer) => {
    answer.createBy = options.user.userMasterId;
    answer.createByIp = options.user.userIpAddress;
  });
});
module.exports = PreboardingFormCustomize;
