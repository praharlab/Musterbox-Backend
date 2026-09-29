const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'probationPolicy';
const ProbationPolicy = sequelize.define(
  table_name,
  {
    probationPolicyID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    policyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    periodDuration: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    durationType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    extendTime: {
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['policyName'],
      },
      {
        unique: false,
        fields: ['periodDuration'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

ProbationPolicy.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = ProbationPolicy;
