const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'weekOffPolicy';
const CompanyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const { weekoffTypeEnum } = require('../utils/dbUtils');
const weekOffPolicy = sequelize.define(
  table_name,
  {
    weekOffPolicyID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    weekOffPolicyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.BIGINT,
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
    weekoffType: {
      type: Sequelize.ENUM(...Object.values(weekoffTypeEnum)),
      allowNull: true,
    },
    monthlyFix: {
      type: Sequelize.FLOAT,
    },
    presentDays: {
      type: Sequelize.FLOAT,
    },
    isNoWeekoffPolicy: {
      type: Sequelize.BOOLEAN,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['weekOffPolicyName'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

weekOffPolicy.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = weekOffPolicy;
