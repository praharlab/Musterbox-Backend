const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Penalty = require('./penalty');
const HRSalaryTrasaction = require('./hrSalaryTransaction');
const table_name = 'employeePenalty';
const EmployeePenalty = sequelize.define(
  table_name,
  {
    employeePenaltyID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    penaltyID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    penaltyDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    penaltyAmount: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    attachment: {
      type: Sequelize.STRING,
      allowNull: true,
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
    RefrenceId: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    TableName: {
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
        fields: ['penaltyDate'],
      },
      {
        unique: false,
        fields: ['penaltyAmount'],
      },
      {
        unique: false,
        fields: ['penaltyID'],
      },
    ],
  }
);

EmployeePenalty.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeePenalty.belongsTo(Penalty, {
  as: 'penalty',
  foreignKey: { name: 'penaltyID' },
});

EmployeePenalty.belongsTo(UserMaster, {
  as: 'createdByUser',
  foreignKey: { name: 'createBy' },
});

EmployeePenalty.belongsTo(HRSalaryTrasaction, {
  foreignKey: { name: 'RefrenceId' },
});

HRSalaryTrasaction.hasMany(EmployeePenalty, {
  foreignKey: { name: 'RefrenceId' },
});

module.exports = EmployeePenalty;
