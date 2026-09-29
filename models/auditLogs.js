const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('../models/companyMaster');
const table_name = 'auditLogs';
const { DatabaseOperationEnum } = require('../utils/dbUtils');

const AuditLogs = sequelize.define(table_name, {
  auditLogsID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  companyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  operation: {
    type: Sequelize.ENUM(...Object.values(DatabaseOperationEnum)),
    allowNull: false,
  },
  oldValue: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  newValue: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  tableName: {
    type: Sequelize.STRING,
    allowNull: false,
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
});

AuditLogs.belongsTo(CompanyMaster, { foreignKey: { name: 'companyMasterID' } });

module.exports = AuditLogs;
