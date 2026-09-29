const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const hrSalaryFields = require('./hrSalaryFields');
const table_name = 'otherPaymentDetails';

const otherpaymentdetails = sequelize.define(
  table_name,
  {
    otherPaymentDetailsID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    //foreign key
    companyMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    //foreign key
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    salaryFieldID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    YearMM: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    Amount: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    Details: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    tablereferenceID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    tableName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    AuthorizationStatus: {
      type: Sequelize.INTEGER,
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
        fields: ['companyMasterID'],
      },
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['salaryFieldID'],
      },
    ],
  }
);

otherpaymentdetails.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
otherpaymentdetails.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
otherpaymentdetails.belongsTo(hrSalaryFields, {
  foreignKey: { name: 'salaryFieldID' },
});

module.exports = otherpaymentdetails;
