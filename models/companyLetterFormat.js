const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'companyLetterFormat';

const CompanyLetterFormat = sequelize.define(table_name, {
  companyLetterFormatID: {
    type: Sequelize.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  letterName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  letterFormat: {
    type: Sequelize.STRING,
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
    allowNull: false,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

CompanyLetterFormat.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
}),
  (module.exports = CompanyLetterFormat);
