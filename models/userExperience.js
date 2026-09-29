const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CityMaster = require('./citymaster');
const UserMaster = require('./userMaster');
const table_name = 'userExperience';
const UserExperience = sequelize.define(
  table_name,
  {
    userExperienceID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    designation: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fromDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    toDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    organization: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    roleRespo: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
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
      {
        unique: false,
        fields: ['designation'],
      },
    ],
  }
);

UserExperience.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
UserMaster.hasMany(UserExperience, { foreignKey: { name: 'userMasterID' } });
module.exports = UserExperience;
