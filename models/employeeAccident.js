const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'employeeAccident';
const UserMaster = require('./userMaster');
const BranchMaster = require('./branchMaster');
const EmploeeAccident = sequelize.define(
  table_name,
  {
    AccidentID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    NoticeDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },

    AccidentDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    AccidentTime: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    AccidentLocation: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    AccidentCause: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    InjuryNature: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    WitnessOneName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    WitnessOneAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    WitnessOneOccupation: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    WitnessSecondName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    WitnessSecondAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    WitnessSecondOccupation: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    ReturnDate: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    TotalDays: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    status: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    updateBy: {
      type: Sequelize.INTEGER,
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
    ],
  }
);

EmploeeAccident.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });

module.exports = EmploeeAccident;
