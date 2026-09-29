const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'test';
const Test = sequelize.define(table_name, {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
});

module.exports = Test;
