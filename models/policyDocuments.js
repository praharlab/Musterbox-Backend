const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');

const PolicyDocuments = sequelize.define(
  'policyDocuments',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    document: {
      type: Sequelize.TEXT,
      allowNull: false,
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
  { paranoid: true }
);
PolicyDocuments.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterId' },
});

PolicyDocuments.addHook('beforeCreate', (policyDocuments, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  policyDocuments.createBy = options.user.userMasterId;
  policyDocuments.updateBy = options.user.userMasterId;
  policyDocuments.createByIp = options.user.userIpAddress;
  policyDocuments.updateByIp = options.user.userIpAddress;
});

PolicyDocuments.addHook('beforeUpdate', (policyDocuments, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  policyDocuments.updateBy = options.user.userMasterId;
  policyDocuments.updateByIp = options.user.userIpAddress;
});

PolicyDocuments.addHook('beforeDestroy', (policyDocuments, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  policyDocuments.deleteBy = options.user.userMasterId;
  policyDocuments.deleteByIp = options.user.userIpAddress;
});

module.exports = PolicyDocuments;
