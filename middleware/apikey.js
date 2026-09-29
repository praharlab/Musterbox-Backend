const logger = require('../config/logger');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});
const validateKey = (req, res, next) => {
  let myKyey = process.env.WINSTON_API_KEY;
  let api_key = req.header('x-api-key');
  if (myKyey === api_key) {
    logger.info(`API Key Match`);
    next();
  } else {
    logger.info('API key Not Match!');
    const error = new Error('API key Not Match!');
    error.statusCode = 401;
    throw error;
  }
};

module.exports = { validateKey };
