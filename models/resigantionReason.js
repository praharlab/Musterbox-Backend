const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'resigantionReason';
const ResigantionReason = sequelize.define(
  table_name,
  {
    resigantionReasonID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    reason: {
      type: Sequelize.STRING,
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
  {
    paranoid: true,
  }
);
ResigantionReason.addHook('beforeCreate', (resigantionReason, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  resigantionReason.createBy = options.user.userMasterId;
  resigantionReason.updateBy = options.user.userMasterId;
  resigantionReason.createByIp = options.user.userIpAddress;
  resigantionReason.updateByIp = options.user.userIpAddress;
});

ResigantionReason.addHook('beforeUpdate', (resigantionReason, options) => {
  resigantionReason.updateBy = options.user.userMasterId;
  resigantionReason.ipAddress = options.user.userIpAddress;
  resigantionReason.updateByIp = options.user.userIpAddress;
});

ResigantionReason.addHook('beforeDestroy', (resigantionReason, options) => {
  resigantionReason.deleteBy = options.user.userMasterId;
  resigantionReason.deleteByIp = options.user.userIpAddress;
});

// ResigantionReason.belongsTo(Resigantion, { foreignKey: 'resignationID' });

module.exports = ResigantionReason;