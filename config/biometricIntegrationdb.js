const path = require('path');
const dotenv = require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const getbioMetricsConfig = (isThirdParty, database) => {
  const config = {
    server: dotenv.parsed.BIOMETRICS_SERVER,
    port: +dotenv.parsed.BIOMETRICS_PORT,
    user: dotenv.parsed.BIOMETRICS_USER,
    password: dotenv.parsed.BIOMETRICS_PASSWORD,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      trustServerCertificate: true, // change to true for local dev / self-signed certs
      requestTimeout: 120000,
    },
  };
  if (database) config['database'] = database;
  else
    config['database'] = isThirdParty
      ? dotenv.parsed.BIOMETRICS_DATABASE_THIRD_PARTY
      : dotenv.parsed.BIOMETRICS_DATABASE_SELF;
  return config;
};

module.exports = getbioMetricsConfig;
