const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const LoanMaster = require('../models/loanMaster');
const table_name = 'loanTransaction';

const LoanTransaction = sequelize.define(
  table_name,
  {
    LoanTrasactionId: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    //foreign key
    LoanID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    EMIAmount: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    monthlyPrinciple: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    monthlyInterest: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    EMIMonth: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    RefrenceId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    TableName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    BalAmount: {
      type: Sequelize.FLOAT,
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['LoanID'],
      },
    ],
  }
);

LoanTransaction.belongsTo(LoanMaster, { foreignKey: { name: 'LoanID' } });
LoanMaster.hasMany(LoanTransaction, { foreignKey: { name: 'LoanID' } });
module.exports = LoanTransaction;
