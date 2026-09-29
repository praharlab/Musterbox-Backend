const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'letterTemplateType';
const LetterTemplateType = sequelize.define(
  table_name,
  {
    letterTypeID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    letterTypename: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.BIGINT,
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['letterTypename'],
      },
    ],
  }
);

module.exports = LetterTemplateType;
