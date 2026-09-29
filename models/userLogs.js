const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const companyMaster = require('./companyMaster');
const table_name = 'userLogs';
const UserLogs = sequelize.define(table_name, {
  userLogsID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  companyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  functionalityUse: {
    type: Sequelize.STRING,
    allowNull: false,
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
});

UserLogs.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });
UserLogs.belongsTo(companyMaster, { foreignKey: { name: 'companyMasterID' } });

module.exports = UserLogs;
