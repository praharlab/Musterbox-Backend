const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');

const EmployeeTaxRegime = sequelize.define(
  'employeeTaxRegime',
  {
    employeeTaxRegimeID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    financialYear: {
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

EmployeeTaxRegime.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeTaxRegime.addHook('beforeCreate', (regime, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  regime.createBy = options.user.userMasterId;
  regime.updateBy = options.user.userMasterId;
  regime.createByIp = options.user.userIpAddress;
  regime.updateByIp = options.user.userIpAddress;
});

EmployeeTaxRegime.addHook('beforeUpdate', (regime, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  regime.updateBy = options.user.userMasterId;
  regime.updateByIp = options.user.userIpAddress;
});

EmployeeTaxRegime.addHook('beforeDestroy', (regime, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  regime.deleteBy = options.user.userMasterId;
  regime.deleteByIp = options.user.userIpAddress;
});

module.exports = EmployeeTaxRegime;
