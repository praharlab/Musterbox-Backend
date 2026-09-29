const { JSON } = require('sequelize');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'weekOffOptions';
const WeekOffPolicy = require('./weekOffPolicy');
const WeekOffOptions = sequelize.define(
  table_name,
  {
    weekOffOptionsID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    weekOffPolicyID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    day: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    options: {
      type: Sequelize.JSONB,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['weekOffPolicyID'],
      },
      {
        unique: false,
        fields: ['day'],
      },
    ],
  }
);

WeekOffOptions.belongsTo(WeekOffPolicy, {
  foreignKey: { name: 'weekOffPolicyID' },
});
module.exports = WeekOffOptions;
