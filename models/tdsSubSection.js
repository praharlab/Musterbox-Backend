const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'tdsSubSection';
const tdsSection = require('./tdsSection');
const TdsSubSectionCategory = require('./tdsSubSectionCategory');

const tdsSubSection = sequelize.define(table_name, {
  tdsSubSectionID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  tdsSubSectionName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  tdsSubSectionDescription: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  tdsSectionID: {
    type: Sequelize.BIGINT,
    allowNull: false,
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
  maxLimit: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  tdsSubSectionCategoryID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
});

tdsSubSection.belongsTo(tdsSection, {
  foreignKey: { name: 'tdsSectionID' },
});

tdsSubSection.belongsTo(TdsSubSectionCategory, {
  foreignKey: { name: 'tdsSubSectionCategoryID' },
});

tdsSubSection.addHook('beforeCreate', (tdssubSection, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  tdssubSection.createByIp = options.user.userIpAddress;
  tdssubSection.updateByIp = options.user.userIpAddress;
});

tdsSubSection.addHook('beforeUpdate', (tdssubSection, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  tdssubSection.updateBy = options.user.userMasterId;
  tdssubSection.updateByIp = options.user.userIpAddress;
});

tdsSubSection.addHook('beforeDestroy', (tdssubSection, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  tdssubSection.deleteBy = options.user.userMasterId;
  tdssubSection.deleteByIp = options.user.userIpAddress;
});

module.exports = tdsSubSection;
