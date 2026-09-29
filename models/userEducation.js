const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CityMaster = require('./citymaster');
const UserMaster = require('./userMaster');
const table_name = 'userEducation';
const UserEducation = sequelize.define(
  table_name,
  {
    userEducationID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    qualification: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    yearOfPassing: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    grade: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    percentageObtained: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    institute: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    university: {
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
    degree: {
      type: Sequelize.STRING,
      allowNull: false,
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
    ],
  }
);

UserEducation.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
UserMaster.hasMany(UserEducation, { foreignKey: { name: 'userMasterID' } });

module.exports = UserEducation;
