const dotenv = require('dotenv').config();

module.exports = {
  development: {
    username: dotenv.parsed.DB_USER,
    password: dotenv.parsed.DB_PASSWORD,
    database: dotenv.parsed.DB_DATABASE,
    host: dotenv.parsed.DB_HOST,
    dialect: dotenv.parsed.DB_DIALECT,
  },
};
