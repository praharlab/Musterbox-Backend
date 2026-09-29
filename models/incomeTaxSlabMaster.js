const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const incomeTaxSlabMaster = sequelize.define(
  'incomeTaxSlabMaster',
  {
    incomeTaxSlabMasterID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    assessmentYear: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    gender: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    regime: {
      type: Sequelize.STRING,
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
      type: Sequelize.INTEGER,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true }
);

incomeTaxSlabMaster.addHook('beforeCreate', (slabMaster, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  slabMaster.createBy = options.user.userMasterId;
  slabMaster.updateBy = options.user.userMasterId;
  slabMaster.createByIp = options.user.userIpAddress;
  slabMaster.updateByIp = options.user.userIpAddress;
});

incomeTaxSlabMaster.addHook('beforeUpdate', (slabMaster, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  slabMaster.updateBy = options.user.userMasterId;
  slabMaster.updateByIp = options.user.userIpAddress;
});

incomeTaxSlabMaster.addHook('beforeDestroy', (slabMaster, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  slabMaster.deleteBy = options.user.userMasterId;
  slabMaster.deleteByIp = options.user.userIpAddress;
});

module.exports = incomeTaxSlabMaster;
