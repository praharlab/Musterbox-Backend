const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Form16child = require('./form16child');
const UserMaster = require('./userMaster');
const table_name = 'investmentdetails';

const InvestmentDetails = sequelize.define(table_name, {
  InvestmentDetailsID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  //foreign key
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  //foreign key
  Form16ChildID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  InvestmentName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  InvestmentAmount: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  YearMonth: {
    type: Sequelize.INTEGER,
    allowNull: false,
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
  Status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

InvestmentDetails.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
InvestmentDetails.belongsTo(Form16child, {
  foreignKey: { name: 'Form16ChildID' },
});

module.exports = InvestmentDetails;
