const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'preboardingFormCustomizeValue';
const preboardingFormCustomize = require('./preboardingformcustomize');
const UserMaster = require('./userMaster');

const PreboardingFormCustomizeValue = sequelize.define(table_name, {
  preboardingFormCustomizeValueID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  preboardingFormCustomizeID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  preboardingID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  value: {
    type: Sequelize.TEXT,
    allowNull: true,
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
});

PreboardingFormCustomizeValue.belongsTo(preboardingFormCustomize, {
  foreignKey: { name: 'preboardingFormCustomizeID' },
});

PreboardingFormCustomizeValue.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

PreboardingFormCustomizeValue.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

module.exports = PreboardingFormCustomizeValue;
