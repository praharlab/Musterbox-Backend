const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const LetterTemplateType = require('../models/letterTemplateType');
const table_name = 'letterFields';
const LetterFields = sequelize.define(
  table_name,
  {
    letterFieldsID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    letterFieldsname: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    letterTypeID: {
      type: Sequelize.INTEGER,
      allowNull: false,
      //forign key
    },
    status: {
      type: Sequelize.BIGINT,
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
        fields: ['letterFieldsname'],
      },
    ],
  }
);

LetterFields.belongsTo(LetterTemplateType, {
  foreignKey: { name: 'letterTypeID' },
});

module.exports = LetterFields;
