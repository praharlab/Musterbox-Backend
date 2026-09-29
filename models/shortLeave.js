const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const table_name = 'shortLeave';
const ShortLeave = sequelize.define(
  table_name,
  {
    shortLeaveName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    minutesForShortLeave: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    noOfShortLeave: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    deleteBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true },
  {
    indexes: [
      {
        unique: false,
        fields: ['shortLeaveName'],
      },
    ],
  }
);

ShortLeave.addHook('beforeCreate', (shortLeave, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  shortLeave.createBy = options.user.userMasterId;
  shortLeave.updateBy = options.user.userMasterId;
  shortLeave.createByIp = options.user.userIpAddress;
  shortLeave.updateByIp = options.user.userIpAddress;
});

ShortLeave.addHook('beforeUpdate', (shortLeave, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  shortLeave.updateBy = options.user.userMasterId;
  shortLeave.updateByIp = options.user.userIpAddress;
});

ShortLeave.addHook('beforeDestroy', (shortLeave, options) => {
  shortLeave.deleteBy = options.user.userMasterId;
  shortLeave.deleteByIp = options.user.userIpAddress;
});

ShortLeave.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

ShortLeave.belongsTo(UserMaster,{
  as: 'createdByUserDetails',
  foreignKey: {name: 'createBy'}
});

ShortLeave.belongsTo(UserMaster,{
  as: 'updatedByUserDetails',
  foreignKey: {name: 'updateBy'}
});

ShortLeave.belongsTo(UserMaster,{
  as: 'deletedByUserDetails',
  foreignKey: {name: 'deleteBy'}
});

module.exports = ShortLeave;
