const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { LCEGPenaltyTypeEnum } = require('../utils/dbUtils');

const LCEGPenalty = sequelize.define(
  'lcegPenalty',
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    YYYYMM: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    penaltyType: {
      type: Sequelize.ENUM(...Object.values(LCEGPenaltyTypeEnum)),
      allowNull: false,
    },
    penaltyValue: {
      type: Sequelize.FLOAT,
      allowNull: false,
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['YYYYMM'],
      },
      {
        unique: false,
        fields: ['userMasterID', 'YYYYMM'],
      },
    ],
  }
);

LCEGPenalty.addHook('beforeCreate', (LCEGPenalty, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  LCEGPenalty.createBy = options.user.userMasterId;
  LCEGPenalty.createByIp = options.user.userIpAddress;
});

LCEGPenalty.addHook('beforeUpdate', (LCEGPenalty, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  LCEGPenalty.updateBy = options.user.userMasterId;
  LCEGPenalty.updateByIp = options.user.userIpAddress;
});

LCEGPenalty.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });

UserMaster.hasMany(LCEGPenalty, { foreignKey: { name: 'userMasterID' } });

LCEGPenalty.belongsTo(UserMaster, {
  as: 'createdByUser',
  foreignKey: { name: 'createBy' },
});

LCEGPenalty.belongsTo(UserMaster, {
  as: 'updatedByUser',
  foreignKey: { name: 'updateBy' },
});

module.exports = LCEGPenalty;
