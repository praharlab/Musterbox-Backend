const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const MailTemplateType = require('../models/mailTemplateType');
const table_name = 'Mailfields';
const mailfields = sequelize.define(table_name, {
  mailfieldsid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  mailfields_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  mailTypeID: {
    type: Sequelize.INTEGER,
    allowNull: false,
    //forign key
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
});

mailfields.belongsTo(MailTemplateType, { foreignKey: { name: 'mailTypeID' } });

module.exports = mailfields;
