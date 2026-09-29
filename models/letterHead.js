const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const table_name = 'letterHeadSetups';
const letterhead = sequelize.define(
  table_name,
  {
    letterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    lettername: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    letterhtml: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    dynamicwords: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
    },
    status: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 1,
    },
    companyMasterID: {
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

letterhead.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = letterhead;
