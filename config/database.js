const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});
const { Sequelize } = require('sequelize');
const logger = require('./logger');

const dbHost = process.env.DB_HOST;
const dbDatabase = process.env.DB_DATABASE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbDialect = process.env.DB_DIALECT;

console.log('Connecting to DB...');
const msHrms = new Sequelize(dbDatabase, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDialect,
  dialectOptions: {
    useUTC: false, // for reading from database
  },
  timezone: '+05:30',
  logging: false,
  pool: {
    max: 55,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
});

logger.info(`${dbDatabase} connected.`);

module.exports = msHrms;
