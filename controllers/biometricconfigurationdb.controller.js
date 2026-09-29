const Sequelize = require('sequelize');
const BankMaster = require('../models/bankMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
var sql = require('mssql');
const querystring = require('querystring');
const getbioMetricsConfig = require('../config/biometricIntegrationdb');

exports.biometricDatabaseList = async (req, res, next) => {
  try {
    await sql.connect(getbioMetricsConfig(false));
    const result =
      await sql.query`SELECT name, database_id, create_date FROM sys.databases where database_id not in(1,2,3,4,5,6,7,9); `;
    res.status(200).json({
      status: 200,
      message: 'DB got Successfully',
      data: result.recordset,
    });
  } catch (err) {
    res.status(200).json({
      status: 200,
      message: err.message,
    });
  }
};

exports.biometricTableList = async (req, res, next) => {
  let dbname = req.body.name;

  const sqlConfig = getbioMetricsConfig(false, dbname);

  try {
    await sql.connect(sqlConfig);
    //const result = await sql.query`SELECT * FROM SoftechAttendance.INFORMATION_SCHEMA.TABLES;`

    const queryString =
      'SELECT * FROM ' + dbname + '.INFORMATION_SCHEMA.TABLES;';
    console.log(queryString);
    let pool = await sql.connect(sqlConfig);
    let result1 = await pool.request().query(queryString);

    res.status(200).json({
      status: 200,
      message: 'Tables got Successfully',
      data: result1.recordset,
    });
  } catch (err) {
    res.status(200).json({
      status: 200,
      message: err.message,
    });
  }
};

exports.biometricSerialNoList = async (req, res, next) => {
  var tablename = req.body.tablename;
  var databasename = req.body.dbname;

  const sqlConfig = getbioMetricsConfig(false, databasename);

  console.log(tablename);
  try {
    // await sql.connect(sqlConfig)
    // const result = await sql.query `select * from WellsunMedicityPunchLog`;

    const queryString = 'select Distinct Serialnumber from ' + tablename;
    console.log(queryString);
    let pool = await sql.connect(sqlConfig);
    let result1 = await pool.request().query(queryString);
    result1 = result1.recordset;
    for (var i = 0; i < result1.length; i++) {
      if (result1[i].Serialnumber == '' || result1[i].Serialnumber == null) {
        result1.splice(i, 1);
      }
    }
    res.status(200).json({
      status: 200,
      message: 'SerialNo got Successfully',
      data: result1,
    });
  } catch (err) {
    res.status(200).json({
      status: 200,
      message: err.message,
    });
  }
};

exports.createBiometricTable = async (req, res, next) => {
  var tablename = req.body.tablename;
  console.log(tablename);

  try {
    await sql.connect(getbioMetricsConfig(false));
    console.log(req.body.tablename, 'TT');
    const tables =
      await sql.query`SELECT * FROM SoftechAttendance.INFORMATION_SCHEMA.TABLES;`;
    for (var i = 0; i < tables.length; i++) {
      if (
        tables[i].TABLE_NAME.toLowerCase() == req.body.tablename.toLowerCase()
      ) {
        res.status(200).json({
          status: 200,
          message: 'Table Already present',
          data: tables,
        });
      }
    }

    // res.status(200).json({
    //   status: 200,
    //   message: 'Table Not present',
    //   data: tables
    // })

    const queryString =
      'USE [SoftechAttendance] CREATE TABLE [dbo].[' +
      tablename +
      ']([Biomatriclogid] [bigint] IDENTITY(1,1) NOT NULL,[EmployeeCode] [varchar](50) NULL,[logdate] [date] NULL,[logtime] [time](7) NULL,[logdatetime] [datetime] NULL,[Serialnumber] [varchar](50) NULL,[InOut] [varchar](50) NULL,[DataUploaded] [int] NULL,PRIMARY KEY CLUSTERED ([Biomatriclogid] ASC)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]) ON [PRIMARY]';
    console.log(queryString);
    let pool = await sql.connect(getbioMetricsConfig(false));
    let result1 = await pool.request().query(queryString);
    tablename = tablename + '_BiometricCode';
    const queryString2 =
      'USE [SoftechAttendance] CREATE TABLE [dbo].[' +
      tablename +
      ']([Biomatriclogid] [bigint] IDENTITY(1,1) NOT NULL,[EmployeeCode] [varchar](50) NULL,PRIMARY KEY CLUSTERED ([Biomatriclogid] ASC)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]) ON [PRIMARY]';
    console.log(queryString2);
    let result2 = await pool.request().query(queryString2);

    res.status(200).json({
      status: 200,
      message: 'Table Created Successfully',
      data: result1.recordset,
    });
  } catch (err) {
    next(err);
  }
};

// exports.biometricTableList1 = async (req, res, next) => {
//   var dbname = req.body.dbname

//   console.log(dbname);
//   try {

//     // const result = await sql.query (`SELECT DISTINCT Serialnumber from $1;`,${dbname})

//     const queryString = "SELECT DISTINCT Serialnumber from " + dbname ;
//     console.log(queryString);
//     let pool = await sql.connect(sqlConfig)
//         let result1 = await pool.request()
//             .query(queryString)

//     res.status(200).json({
//       status: 200,
//       message: 'DB got Successfully',
//       data: result1
//     })

// }catch(err){
//   res.status(401).json({
//       status: 401,
//       message: err.message,

//     })
// }

// }
