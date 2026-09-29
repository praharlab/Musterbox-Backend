const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const LoanMaster = require('../models/loanMaster');
const table_name = 'loanAdvance';

const LoanAdvance = sequelize.define(
  table_name,
  {
    LoanAdvanceID: {
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
    Amount: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    givenDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    paymentmode: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    refrenceNo: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    refrenceDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
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

LoanAdvance.belongsTo(LoanMaster, { foreignKey: { name: 'LoanID' } });
LoanMaster.hasMany(LoanAdvance, { foreignKey: { name: 'LoanID' } });
module.exports = LoanAdvance;
