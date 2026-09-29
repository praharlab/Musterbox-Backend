const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const KRAMaster = require('./kramaster');
const UserMaster = require('./userMaster');

const KPIMaster = sequelize.define(
  'kpiMaster',
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING(30),
      validate: { max: 30 },
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    weightage: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    targetGiven: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
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

KPIMaster.belongsTo(KRAMaster, {
  foreignKey: { name: 'kraMasterId', allowNull: false },
});
KRAMaster.hasMany(KPIMaster);
KPIMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});

KPIMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
KPIMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

KPIMaster.addHook('beforeCreate', (kpi, options) => {
  // Set createdBy, updatedBy, and ipAddress based on the authenticated user
  kpi.createBy = options.user.userMasterId;
  kpi.updateBy = options.user.userMasterId;
  kpi.createByIp = options.user.userIpAddress;
  kpi.updateByIp = options.user.userIpAddress;
});

KPIMaster.addHook('beforeUpdate', (kpi, options) => {
  // Set updatedBy and ipAddress based on the authenticated user
  kpi.updateBy = options.user.userMasterId;
  kpi.updateByIp = options.user.userIpAddress;
});

KPIMaster.addHook('beforeDestroy', (kpi, options) => {
  // Set deletedBy and ipAddress based on the authenticated user
  kpi.deleteBy = options.user.userMasterId;
  kpi.deleteByIp = options.user.userIpAddress;
});
module.exports = KPIMaster;
