const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const LetterHead = require('./letterHead');
const table_name = 'empLetterHead';
const empletterhead = sequelize.define(
  table_name,
  {
    empLetterId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    pdf: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    letterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    issueDate: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    show: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
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
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['letterID'],
      },
    ],
  }
);

empletterhead.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
empletterhead.belongsTo(LetterHead, {
  as: 'letterHead',
  foreignKey: { name: 'letterID' },
});

module.exports = empletterhead;
