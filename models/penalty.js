const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'penalty';
const Penalty = sequelize.define(
  table_name,
  {
    penaltyID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    penaltyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    penaltyAmount: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    deductionFromSalary: {
      type: Sequelize.BOOLEAN,
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
        fields: ['penaltyName'],
      },
      {
        unique: false,
        fields: ['penaltyAmount'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

Penalty.belongsTo(companyMaster, { foreignKey: { name: 'companyMasterID' } });

module.exports = Penalty;
