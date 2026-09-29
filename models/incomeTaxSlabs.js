const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const incomeTaxSlabMaster = require('./incomeTaxSlabMaster');

const incomeTaxSlabs = sequelize.define(
  'incomeTaxSlabs',
  {
    incomeTaxSlabID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    fromAmount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    toAmount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    percentage: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    incomeTaxSlabMasterID: {
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
    deleteBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true }
);

incomeTaxSlabs.belongsTo(incomeTaxSlabMaster, {
  foreignKey: { name: 'incomeTaxSlabMasterID' },
});

incomeTaxSlabs.addHook('beforeCreate', (slabs, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  slabs.createBy = options.user.userMasterId;
  slabs.updateBy = options.user.userMasterId;
  slabs.createByIp = options.user.userIpAddress;
  slabs.updateByIp = options.user.userIpAddress;
});

incomeTaxSlabs.addHook('beforeUpdate', (slabs, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  slabs.updateBy = options.user.userMasterId;
  slabs.updateByIp = options.user.userIpAddress;
});

incomeTaxSlabs.addHook('beforeDestroy', (slabs, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  slabs.deleteBy = options.user.userMasterId;
  slabs.deleteByIp = options.user.userIpAddress;
});

module.exports = incomeTaxSlabs;
