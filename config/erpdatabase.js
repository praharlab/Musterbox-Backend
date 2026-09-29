const path = require('path');
const dotenv = require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const config = {
  server: dotenv.parsed.ERP_SERVER,
  port: +dotenv.parsed.ERP_PORT,
  user: dotenv.parsed.ERP_USER,
  password: dotenv.parsed.ERP_PASSWORD,
  database: dotenv.parsed.ERP_DATABASE,
  options: {
    //encrypt: false,
    //enableArithAbort: true,
    encrypt: true, // Use true if you're on Azure or have SSL enabled
    trustServerCertificate: true, // Use this option if the server has a self-signed certificate
  },
};

module.exports = config;
