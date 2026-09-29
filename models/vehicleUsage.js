const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const table_name = 'vehicleUsage';

const vehicleUsage = sequelize.define(
  table_name,
  {
    vehicleUsageID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    //foreig key
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    startingMeterImage: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    startingDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    endingMeterImage: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    endingDateTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    startkilometer: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    endkilometer: {
      type: Sequelize.FLOAT,
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

vehicleUsage.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
module.exports = vehicleUsage;
