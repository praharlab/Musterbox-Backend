const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const companyMaster = require('./companyMaster');
const table_name = 'advancePayment';
const advancePayment = sequelize.define(table_name, {
  advancePaymentID: {
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
  description: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  amount: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  advanceDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  paymentYearMonth: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  paymentmode: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  referenceNO: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  referenceDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  tablereferenceID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  tableName: {
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

  AdvanceStatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  RejectionRemark: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  viewstatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});
advancePayment.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });
advancePayment.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
advancePayment.belongsTo(userMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});
advancePayment.belongsTo(userMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

module.exports = advancePayment;
