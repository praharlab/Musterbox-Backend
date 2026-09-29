const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'userFamily';
const UserMaster = require('./userMaster');
const userFamily = sequelize.define(
  table_name,
  {
    userFamilyID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    memberName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    dob: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    relation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    contact: {
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
    verifyStatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    verifyBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    nominee: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    percentForNominee: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    rejectionRemarks: {
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
    ],
  }
);

userFamily.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
UserMaster.hasMany(userFamily, { foreignKey: { name: 'userMasterID' } });

module.exports = userFamily;
