const sql = require('mssql');
const AttendanceLogs = require('../models/attendancelogs');
const attendanceTransaction = require('../models/attendanceTransaction');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const OvertimeAuthorizationRequest = require('../models/overtimeAuthorization');
const overTimeCalculation = require('../models/overTimeCalculation');
const shiftModel = require('../models/shift');
const EmployeeShift = require('../models/employeeShift');
const EmployeeBranch = require('../models/employeeBranch');
const UserMaster = require('../models/userMaster');
const { executeQuery } = require('./common.controller');
const userMaster = require('../models/userMaster');
const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const readXlsxFile = require('read-excel-file/node');
const biometricIntegration = require('../models/biometricIntegration');
const hrLeaveBalances = require('../models/hrLeaveBalance');
const coffMaster = require('../models/coffMaster');
const ExecutionStatus = require('../models/executionstatus');
const axios = require('axios');

const AttendancePolicy = require('../models/attendancePolicy');
const { dir } = require('console');
const getbioMetricsConfig = require('../config/biometricIntegrationdb');
const { Op, fn, col } = require('sequelize');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const Shift = require('../models/shift');
const SN_Code = require('../models/sn_code');
const BiometricLogs = require('../models/biometricLogs');
const fs = require('fs');

const {
  checkHoliday,
  overtime,
  employeeAttendancePolicy,
  employeeDepartment,
  employeeShift,
  employeeDesignation,
  addCoff,
  coffOvertime,
  lateComingPenalty,
  earlyByPermission,
  calculateEarlyby,
  calculateDateTimeDifference,
  userDetails,
  addAsopalavBreakTimePenalty,
  addAsopalavBreakTime,
  employeeBranch,
  calculateLateby,
  getshiftTimingbyShiftID,
  getAutomticShiftAssigned,
  asiaKolkataDateTime,
  addCanteenLogPenalty,
  lateEarlyPenaltyManual,
  combined_deductionMobile,
  employeeLateEarlyPolicy,
  addFoodAllowanceInAttendance,
  employeeSalaryPolicy,
  roundToNearestHour,
  getShiftData,
  deleteOvertimeForAttendance,
} = require('../utils/commonUtilFunctions');
const { at } = require('lodash');
const { off } = require('process');
const { stat } = require('fs');

const {
  generateExcel,
  genrateDemoExcelForBiometricAttendance,
} = require('../utils/exportData');
const CanteenLogs = require('../models/canteenLogs');

exports.fulldayhalfdaycalculation = async (req, res, next) => {
  try {
    let data = await attendanceTransaction.findAll({
      where: {
        [Sequelize.Op.and]: [{ '$userMaster.companyMasterId$': req.params.id }],
      },
      include: [
        {
          model: UserMaster,
          as: 'userMaster',
        },
      ],
    });

    for (var i = 0; i < data.length; i++) {
      let dayname = new Date(data[i].AttendanceDate).toLocaleString('en-us', {
        weekday: 'long',
      });
      var diff = 0;
      var minutes = 0;
      if (data[i].OutDateTime) {
        diff = Math.abs(
          new Date(data[i].OutDateTime) - new Date(new Date(data[i].InDatetime))
        );
        minutes = Math.floor(diff / 1000 / 60);
      }

      let fulldayhalfday = await executeQuery(
        'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
          data[i].Shift +
          ',' +
          "'" +
          dayname +
          "'" +
          ',' +
          minutes +
          ')'
      );

      let change_data = await attendanceTransaction.update(
        {
          InHrs: minutes,
          fulldayhalfday: Number(fulldayhalfday[0].fulldayhalfday),
        },
        {
          where: { AttendanceTransID: data[i].AttendanceTransID },
        }
      );
    }

    res.status(200).json({
      status: 200,
      message: 'Attendance Sync Successfully.',
    });
  } catch (err) {
    next(err);
  }
};

exports.excelattendance = async (req, res, next) => {
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    let CompanyContacts = [];
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();

      let userContacts = [];
      rows.forEach((row) => {
        let CompanyContact2 = {
          EmployeeCode: row[0],
          logdatetime: row[1],
          createBy: req.body.createBy,
          createByIp: req.body.createByIp,
        };
        userContacts.push(CompanyContact2);
      });

      const result = userContacts;
      console.log(result);
      for (var i = 0; i < result.length; i++) {
        let joiningdata = await EmployeeJoiningDetails.findOne({
          where: {
            biometricCode: String(result[i].EmployeeCode),
            '$userMaster.companyMasterId$': req.body.companyMasterID,
          },
          include: [
            {
              model: userMaster,
            },
          ],
        });
        if (joiningdata) {
          insert_db = await AttendanceLogs.create({
            userMasterID: joiningdata.userMasterID,
            AttendanceTransID: attendaceTransType.biometricNotValidated,
            logDateTime: result[i].logdatetime - 1000 * (60 * 330),
            direction: '',
            photo: '',
            attendnaceFrom: 'biometric',
            longitude: '',
            latitude: '',
            address: '',
            createBy: 1,
            createByIp: '192.168.1.1',
          });
        }
      }
      res.status(200).json({
        status: 200,
        message: 'Attendance Sync Successfully.',
        count: result.length,
        data: result,
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.DynamicData = async (req, res, next) => {
  try {
    let incount = 0;
    let outcount = 0;
    let userDate;
    let dt = new Date();
    let lastdate = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
    let month =
      lastdate.getMonth() + 1 > 9
        ? lastdate.getMonth() + 1
        : '0' + (lastdate.getMonth() + 1);
    userDate =
      new Date().getDate() + '/' + month + '/' + lastdate.getFullYear();
    let firstdate = '01/' + month + '/' + lastdate.getFullYear();
    if (new Date().getDate() < 10) {
      lastdate = '0' + userDate;
    } else {
      lastdate = userDate;
    }

    var basicauth = process.env.ETIMEOFFICE_INOUT_AUTH;
    let res1 = await axios.get(
      `${process.env.ETIMEOFFICE_BASE_URL}/api/DownloadInOutPunchData?Empcode=ALL&FromDate=` +
        firstdate +
        '&ToDate=' +
        lastdate,
      {
        auth: {
          username: basicauth,
          password: process.env.ETIMEOFFICE_INOUT_PASSWORD,
        },
      }
    );
    var apidata = res1.data.InOutPunchData;

    if (apidata.length == 0) {
      return res.status(200).json({
        status: 200,
        message: 'No data Present',
        data: apidata,
      });
    }

    const DynamicAttendanceConfig = getbioMetricsConfig(false);
    for (var i = 0; i < apidata.length; i++) {
      if (apidata[i].INTime != '--:--') {
        incount = incount + 1;
        const originalDate = apidata[i].DateString;
        const parts = originalDate.split('/');
        const convertedDate = parts[2] + '-' + parts[1] + '-' + parts[0];
        apidata[i].INTime = apidata[i].INTime + ':00';
        let finalDateTime = convertedDate + ' ' + apidata[i].INTime;
        finalDateTime = new Date(finalDateTime).toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });

        var inputDate = new Date(finalDateTime);
        var year = inputDate.getFullYear();
        var month1 = String(inputDate.getMonth() + 1).padStart(2, '0');
        var day = String(inputDate.getDate()).padStart(2, '0');
        var hour = String(inputDate.getHours()).padStart(2, '0');
        var minute = String(inputDate.getMinutes()).padStart(2, '0');
        var formattedDate = `${year}-${month1}-${day}T${hour}:${minute}:00`;

        finalDateTime = formattedDate;

        let queryString =
          "select * from DynamicAutoloomsPunchLog where logdatetime='" +
          finalDateTime +
          "' and EmployeeCode='" +
          apidata[i].Empcode +
          "'";
        let pool = await sql.connect(DynamicAttendanceConfig);
        let result = await pool.request().query(queryString);

        if (result.length == 0) {
          let insertqueryString =
            "INSERT INTO [dbo].[DynamicAutoloomsPunchLog] ([EmployeeCode], [logdate], [logtime], [logdatetime], [Serialnumber], [InOut], [DataUploaded]) VALUES ('" +
            apidata[i].Empcode +
            "', '" +
            convertedDate +
            "', '" +
            apidata[i].INTime +
            "', '" +
            finalDateTime +
            "', 'dynamic1', 'IN', 0);";

          let pool1 = await sql.connect(DynamicAttendanceConfig);
          let insertresult = await pool1.request().query(insertqueryString);
        }
      }

      if (apidata[i].OUTTime != '--:--') {
        outcount = outcount + 1;
        const originalDate = apidata[i].DateString;
        const parts = originalDate.split('/');
        const convertedDate = parts[2] + '-' + parts[1] + '-' + parts[0];

        apidata[i].OUTTime = apidata[i].OUTTime + ':00';
        let finalDateTime = convertedDate + ' ' + apidata[i].OUTTime;
        finalDateTime = new Date(finalDateTime).toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });

        var inputDate = new Date(finalDateTime);
        var year = inputDate.getFullYear();
        var month1 = String(inputDate.getMonth() + 1).padStart(2, '0');
        var day = String(inputDate.getDate()).padStart(2, '0');
        var hour = String(inputDate.getHours()).padStart(2, '0');
        var minute = String(inputDate.getMinutes()).padStart(2, '0');
        var formattedDate = `${year}-${month1}-${day}T${hour}:${minute}:00`;

        finalDateTime = formattedDate;

        let queryString =
          "select * from DynamicAutoloomsPunchLog where logdatetime='" +
          finalDateTime +
          "' and EmployeeCode='" +
          apidata[i].Empcode +
          "'";
        let pool = await sql.connect(DynamicAttendanceConfig);
        let result = await pool.request().query(queryString);

        if (result.length == 0) {
          let insertqueryString =
            "INSERT INTO [dbo].[DynamicAutoloomsPunchLog] ([EmployeeCode], [logdate], [logtime], [logdatetime], [Serialnumber], [InOut], [DataUploaded]) VALUES ('" +
            apidata[i].Empcode +
            "', '" +
            convertedDate +
            "', '" +
            apidata[i].OUTTime +
            "', '" +
            finalDateTime +
            "', 'dynamic1', 'OUT', 0);";

          let pool1 = await sql.connect(DynamicAttendanceConfig);
          let insertresult = await pool1.request().query(insertqueryString);
        }
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Data Updated Successfully',
      count: 0,
      data: incount + outcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.AaryavartData = async (req, res, next) => {
  try {
    const currentDate = new Date();

    // Extract the month and year
    const month = currentDate.getMonth() + 1; // Adding 1 because months are zero-based
    const year = currentDate.getFullYear();

    // Create the formatted string "MMYYYY"
    const formattedDate = `${month < 10 ? '0' : ''}${month}${year}`;
    console.log(formattedDate, 'Dates');

    var basicauth = process.env.ETIMEOFFICE_LASTPUNCH_AUTH;
    let res1 = await axios.get(
      `${process.env.ETIMEOFFICE_BASE_URL}/api/DownloadLastPunchData?Empcode=ALL&LastRecord=` +
        formattedDate +
        '$0',
      {
        auth: {
          username: basicauth,
          password: process.env.ETIMEOFFICE_LASTPUNCH_PASSWORD,
        },
      }
    );
    var apidata = res1.data.PunchData;

    if (apidata.length == 0) {
      return res.status(200).json({
        status: 200,
        message: 'No data Present',
        data: apidata,
      });
    }

    const AaryavartConfig = getbioMetricsConfig(false);
    for (var i = 0; i < apidata.length; i++) {
      if (apidata[i].PunchDate) {
        // Input date string
        const dateString = apidata[i].PunchDate;

        // Split the date and time parts
        const [datePart, timePart] = dateString.split(' ');

        // Split the date part into day, month, and year
        const [day, month, year] = datePart.split('/');

        // Split the time part into hours, minutes, and seconds
        const [hours, minutes, seconds] = timePart.split(':');

        // Create the ISO 8601 formatted date string
        const isoFormattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

        let finalDateTime = isoFormattedDate;
        let convertedDate = finalDateTime.slice(0, 10);
        let convertedTime = hours + ':' + minutes;

        let queryString =
          "select * from AaryavartPunchLog where logdatetime='" +
          finalDateTime +
          "' and EmployeeCode='" +
          apidata[i].Empcode +
          "'";
        let pool = await sql.connect(AaryavartConfig);
        let result = await pool.request().query(queryString);

        if (result.length == 0) {
          let insertqueryString =
            "INSERT INTO [dbo].[AaryavartPunchLog] ([EmployeeCode], [logdate], [logtime], [logdatetime], [Serialnumber], [InOut], [DataUploaded]) VALUES ('" +
            apidata[i].Empcode +
            "', '" +
            convertedDate +
            "', '" +
            convertedTime +
            "', '" +
            finalDateTime +
            "', 'aaryavart1', '', 0);";
          console.log(insertqueryString, 'query');
          let pool1 = await sql.connect(AaryavartConfig);
          let insertresult = await pool1.request().query(insertqueryString);
        }
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Data Updated Successfully',
      count: 0,
      data: apidata.length,
    });
  } catch (err) {
    // if (!err.statusCode) {
    //   res.status(200).json({ status: 401, message: err.message, data: {} });
    // }
    next(err);
  }
};

exports.pendingbiometricsync = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      serialNo,
      fromDate,
      toDate,
      status,
      page,
      limit,
      exportData,
      exportFileType,
    } = req.body;
    const offset = (page - 1) * limit;

    let get_one_data = await biometricIntegration.findOne({
      where: {
        companyMasterID: companyMasterID,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (
      !get_one_data ||
      (get_one_data.biometricSerialNo &&
        get_one_data.biometricSerialNo.length == 0)
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Biometric integration not found',
        data: [],
      });
    } else {
      let result = [],
        totalcount = [];

      if (exportData) {
        if (serialNo) {
          if (!get_one_data.biometricSerialNo.includes(serialNo)) {
            return res.status(200).json({
              status: 401,
              message: 'Serial number did not match',
              data: [],
            });
          }

          const index = get_one_data.biometricSerialNo.indexOf(serialNo);

          if (get_one_data.table[index] == 'AIFaceAttendance') {
            let futureDate = new Date(new Date(toDate).getTime() + 86400000)
              .toISOString()
              .slice(0, 10);

            const allLogs = await BiometricLogs.findAndCountAll({
              where: {
                Serialnumber: serialNo,
                logDateTime: {
                  [Sequelize.Op.between]: [
                    new Date(fromDate),
                    new Date(futureDate),
                  ],
                },
              },
              raw: true,
            });

            for (var item of allLogs.rows) {
              let tempLog = {
                Biomatriclogid: '',
                EmployeeCode: item.EmployeeCode,
                logdate: '',
                logtime: '',
                logdatetime: item.logDateTime,
                Serialnumber: item.Serialnumber,
                InOut: '0',
                DataUploaded: null,
                Image64: item.Image64,
                InOut: '0',
                Mode: '',
              };
              result.push(tempLog);
            }
            let temp = { recordCount: allLogs.count };
            totalcount.push(temp);
          } else {
            const sqlConfig1 = getbioMetricsConfig(
              false,
              get_one_data.database[index]
            );

            let queryString = '';

            if (status == 'pending') {
              queryString =
                `select * from ` +
                get_one_data.table[index] +
                ` where isnull(datauploaded,0)=0 and Serialnumber in('` +
                get_one_data.biometricSerialNo[index] +
                `') AND logdate BETWEEN '` +
                fromDate +
                `' AND '` +
                toDate +
                `' order by logdate DESC`;
            } else {
              queryString =
                `select * from ` +
                get_one_data.table[index] +
                ` where Serialnumber in('` +
                get_one_data.biometricSerialNo[index] +
                `') AND logdate BETWEEN '` +
                fromDate +
                `' AND '` +
                toDate +
                `' order by logdate DESC`;
            }

            let pool = await sql.connect(sqlConfig1);
            result = await pool.request().query(queryString);

            result = result.recordsets[0] || [];
          }
        }

        result.forEach((item) => {
          delete item.Image64;
          item.DataUploaded = item.DataUploaded ? 'YES' : 'NO';
        });

        await generateExcel(
          result,
          'Biometric-Sync-Excel',
          exportFileType,
          res
        );
        return;
      } else {
        // let result = []
        if (serialNo) {
          if (!get_one_data.biometricSerialNo.includes(serialNo)) {
            return res.status(200).json({
              status: 401,
              message: 'Serial number did not match',
              data: [],
            });
          }

          const index = get_one_data.biometricSerialNo.indexOf(serialNo);

          if (get_one_data.table[index] == 'AIFaceAttendance') {
            let futureDate = new Date(new Date(toDate).getTime() + 86400000)
              .toISOString()
              .slice(0, 10);

            const allLogs = await BiometricLogs.findAndCountAll({
              where: {
                Serialnumber: serialNo,
                logDateTime: {
                  [Sequelize.Op.between]: [
                    new Date(fromDate),
                    new Date(futureDate),
                  ],
                },
              },
              raw: true,
              limit: limit,
              offset: offset,
            });

            for (var item of allLogs.rows) {
              let tempLog = {
                Biomatriclogid: '',
                EmployeeCode: item.EmployeeCode,
                logdate: '',
                logtime: '',
                logdatetime: item.logDateTime,
                Serialnumber: item.Serialnumber,
                InOut: '0',
                DataUploaded: null,
                Image64: item.Image64,
                InOut: '0',
                Mode: '',
              };
              result.push(tempLog);
            }
            let temp = { recordCount: allLogs.count };
            totalcount.push(temp);
          } else {
            const sqlConfig1 = getbioMetricsConfig(
              false,
              get_one_data.database[index]
            );

            let queryString = '',
              queryStringtotalcount = '';

            if (status == 'pending') {
              queryString =
                `select * from ` +
                get_one_data.table[index] +
                ` where isnull(datauploaded,0)=0 and Serialnumber in('` +
                get_one_data.biometricSerialNo[index] +
                `') AND logdate BETWEEN '` +
                fromDate +
                `' AND '` +
                toDate +
                `' order by logdatetime DESC OFFSET ` +
                offset +
                ` ROWS
              FETCH NEXT ` +
                limit +
                ` ROWS ONLY`;

              queryStringtotalcount =
                `select COUNT(*) AS recordCount from ` +
                get_one_data.table[index] +
                ` where isnull(datauploaded,0)=0 and Serialnumber in('` +
                get_one_data.biometricSerialNo[index] +
                `') AND logdate BETWEEN '` +
                fromDate +
                `' AND '` +
                toDate +
                `'`;
            } else {
              queryString =
                `select * from ` +
                get_one_data.table[index] +
                ` where Serialnumber in('` +
                get_one_data.biometricSerialNo[index] +
                `') AND logdate BETWEEN '` +
                fromDate +
                `' AND '` +
                toDate +
                `' order by logdatetime DESC OFFSET ` +
                offset +
                ` ROWS
              FETCH NEXT ` +
                limit +
                ` ROWS ONLY`;

              queryStringtotalcount =
                `select COUNT(*) AS recordCount from ` +
                get_one_data.table[index] +
                ` where Serialnumber in('` +
                get_one_data.biometricSerialNo[index] +
                `') AND logdate BETWEEN '` +
                fromDate +
                `' AND '` +
                toDate +
                `'`;
            }

            let pool = await sql.connect(sqlConfig1);
            result = await pool.request().query(queryString);

            let pool1 = await sql.connect(sqlConfig1);
            totalcount = await pool1.request().query(queryStringtotalcount);

            result = result.recordsets[0];

            totalcount = totalcount.recordsets[0];
          }
        }

        return res.status(200).json({
          status: 200,
          message: 'Logs got Successfully.',
          data: result,
          totalcount: totalcount?.[0]?.recordCount || 0,
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

exports.biometricsync = async (req, res, next) => {
  try {
    const execution_status = await ExecutionStatus.findOne({
      where: {
        companyMasterID: req.body.companyMasterID,
      },
      raw: true,
    });

    if (execution_status) {
      let get_User = await userMaster.findOne({
        where: {
          userMasterID: execution_status.userMasterID,
        },
        raw: true,
      });

      let user = '';
      let number = '';
      if (get_User) {
        user = get_User.displayName;
        number = get_User.userNumber;
      }

      if (execution_status.status == 1) {
        return res.status(200).json({
          status: 401,
          message:
            'Biometric Sync cannot be performed because ' +
            user +
            ' (' +
            number +
            ') is already performing these operation',
          count: 0,
          data: [],
        });
      } else {
        return res.status(200).json({
          status: 401,
          message:
            'Biometric Sync cannot be performed because ' +
            user +
            ' (' +
            number +
            ') is already performing Biometric Validation operation',
          count: 0,
          data: [],
        });
      }
    } else {
      const get_one_data = await biometricIntegration.findOne({
        where: {
          companyMasterID: req.body.companyMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        raw: true,
      });

      if (!get_one_data) {
        return res.status(200).json({
          status: 200,
          message: 'Biometric integration not found',
          count: 0,
          data: [],
        });
      }

      let result = [];
      await ExecutionStatus.create({
        userMasterID: req.body.createBy,
        companyMasterID: req.body.companyMasterID,
        status: 1,
        createBy: req.body.createBy,
        createByIp: req.body.createByIp,
      });

      // let result = []
      for (var j = 0; j < get_one_data.biometricSerialNo.length; j++) {
        let sqlConfig1;
        if (
          get_one_data.integrationType &&
          get_one_data.integrationType[j] == 'parallelDatabase'
        ) {
          sqlConfig1 = getbioMetricsConfig(false, get_one_data.database[j]);

          let queryString = '';
          queryString =
            `select * from ` +
            get_one_data.table[j] +
            ` where isnull(datauploaded,0)=0 and Serialnumber in('` +
            get_one_data.biometricSerialNo[j] +
            `') order by logdate`;

          console.log(queryString);
          let pool = await sql.connect(sqlConfig1);
          result = await pool.request().query(queryString);
          result = result.recordset;
        } else if (
          get_one_data.integrationType &&
          (get_one_data.integrationType[j] == 'AIFaceAttendance' ||
            get_one_data.integrationType[j] == 'IpBasedBiometric')
        ) {
          result = await BiometricLogs.findAll({
            where: { Serialnumber: get_one_data.biometricSerialNo[j] },
            raw: true,
          });
        } else {
          await ExecutionStatus.destroy({
            where: {
              companyMasterID: req.body.companyMasterID,
            },
          });

          return res.status(200).json({
            status: 401,
            message: 'Invalid Integration type!',
            count: 0,
            data: [],
          });
        }

        for (var i = 0; i < result.length; i++) {
          const joiningdata = await EmployeeJoiningDetails.findOne({
            where: {
              biometricCode: result[i].EmployeeCode,
              '$userMaster.companyMasterId$': req.body.companyMasterID,
              leavingDate: {
                [Sequelize.Op.eq]: null,
              },
              biometricSerialNo: {
                [Sequelize.Op.iLike]: '%' + result[i].Serialnumber.trim() + '%',
              },
              '$userMaster.status$': 1,
              status: 1,
            },
            include: [{ model: userMaster, as: 'userMaster' }],
          });

          if (
            joiningdata &&
            result[i].Serialnumber &&
            joiningdata.biometricSerialNo
          ) {
            result[i].Serialnumber = result[i].Serialnumber.trim();
            var arr_assign_biometric = joiningdata.biometricSerialNo.split(',');
            var flag = 0;
            for (var k = 0; k < arr_assign_biometric.length; k++) {
              if (arr_assign_biometric[k])
                arr_assign_biometric[k] = arr_assign_biometric[k].trim();
              if (arr_assign_biometric[k] == result[i].Serialnumber) {
                flag = 1;
                break;
              }
            }

            if (flag == 1) {
              let direction = '',
                IMG = '',
                canteenLog = false;

              for (
                var algo = 0;
                algo < get_one_data.biometricSerialNo.length;
                algo++
              ) {
                if (
                  get_one_data.biometricSerialNo[algo].trim() ==
                  result[i].Serialnumber.trim()
                ) {
                  if (+get_one_data.algorithm[algo] == 7) canteenLog = true;

                  if (
                    +get_one_data.algorithm[algo] == 3 ||
                    +get_one_data.algorithm[algo] == 5 ||
                    +get_one_data.algorithm[algo] == 6
                  )
                    direction = get_one_data.direction[algo];
                  if (get_one_data.table[algo].trim() == 'AIFaceAttendance')
                    IMG = ",Image64=''";
                  break;
                }
              }

              // if (result[i].Image64) {
              //   const logDate = asiaKolkataDateTime(
              //     result[i].logdatetime
              //       ? result[i].logdatetime - 1000 * (60 * 330)
              //       : result[i].logDateTime
              //   );
              //   const [year, month] = logDate.split('-');
              //   let dataUrl = 'data:image/png;base64,' + result[i].Image64;
              //   let fileName = `attendaceLogs_${
              //     joiningdata.userMasterID
              //   }_${Date.now()}.png`;
              //   let filePath = `uploads/attendaceLogs/${req.body.companyMasterID}/${month}${year}/`;
              //   result[i].Image64 = filePath + fileName;
              //   attendancePhotobase64Topng(dataUrl, fileName, filePath);
              // }

              if (canteenLog) {
                const log = await CanteenLogs.create({
                  userMasterID: joiningdata.userMasterID,
                  AttendanceTransID: attendaceTransType.biometricNotValidated,
                  logDateTime: result[i].logdatetime
                    ? result[i].logdatetime - 1000 * (60 * 330)
                    : result[i].logDateTime,
                  direction: direction,
                  photo: result[i].Image64 ? result[i].Image64 : '',
                  attendnaceFrom: 'canteen',
                  longitude: '',
                  latitude: '',
                  address: '',
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });

                if (+req.body.companyMasterID == 418)
                  await addCanteenLogPenalty(log);
              } else {
                await AttendanceLogs.create({
                  userMasterID: joiningdata.userMasterID,
                  AttendanceTransID: attendaceTransType.biometricNotValidated,
                  logDateTime: result[i].logdatetime
                    ? result[i].logdatetime - 1000 * (60 * 330)
                    : result[i].logDateTime,
                  direction: direction,
                  photo: result[i].Image64 ? result[i].Image64 : '',
                  attendnaceFrom: 'biometric',
                  longitude: '',
                  latitude: '',
                  address: '',
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });
              }

              if (
                get_one_data.integrationType &&
                get_one_data.integrationType[j] == 'parallelDatabase'
              ) {
                const queryString =
                  'update ' +
                  get_one_data.table[j] +
                  ' set datauploaded=1' +
                  IMG +
                  ' where Biomatriclogid = ' +
                  result[i].Biomatriclogid;

                let pool = await sql.connect(sqlConfig1);
                await pool.request().query(queryString);
              } else if (
                get_one_data.integrationType &&
                (get_one_data.integrationType[j] == 'AIFaceAttendance' ||
                  get_one_data.integrationType[j] == 'IpBasedBiometric')
              ) {
                await BiometricLogs.destroy({
                  where: { biometricLogsID: result[i].biometricLogsID },
                });
              }
            }
          }
        }
      }

      await ExecutionStatus.destroy({
        where: {
          companyMasterID: req.body.companyMasterID,
        },
      });

      return res.status(200).json({
        status: 200,
        message: 'Attendance Sync Successfully.',
        count: result.length,
        data: result,
      });
    }
  } catch (err) {
    await ExecutionStatus.destroy({
      where: { companyMasterID: req.body.companyMasterID },
    });
    next(err);
  }
};

exports.biometricvalidator = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;
    const execution_status = await ExecutionStatus.findOne({
      where: { companyMasterID: companyMasterID },
      raw: true,
    });

    if (execution_status) {
      let get_User = await userMaster.findOne({
        where: {
          userMasterID: execution_status.userMasterID,
        },
        raw: true,
      });

      let user = '';
      let number = '';
      if (get_User) {
        user = get_User.displayName;
        number = get_User.userNumber;
      }

      if (execution_status.status == 1) {
        return res.status(200).json({
          status: 401,
          message:
            'Biometric Validation cannot be performed because ' +
            user +
            ' (' +
            number +
            ') is already performing Biometric Sync operation',
          count: 0,
          data: [],
        });
      } else {
        return res.status(200).json({
          status: 401,
          message:
            'Biometric Validation cannot be performed because ' +
            user +
            ' (' +
            number +
            ') is already performing these operation',
          count: 0,
          data: [],
        });
      }
    } else {
      const company_Shift = await shiftModel.findOne({
        where: { companyMasterID: companyMasterID, status: 1 },
      });

      if (company_Shift) {
        await ExecutionStatus.create({
          userMasterID: req.body.createBy,
          companyMasterID: companyMasterID,
          status: 2,
          createBy: req.body.createBy,
          createByIp: req.body.createByIp,
        });

        const attendanceLog = await AttendanceLogs.findAll({
          raw: true,
          where: {
            '$userMaster.companyMasterId$': companyMasterID,
            AttendanceTransID: attendaceTransType.biometricNotValidated,
          },
          order: [['logDateTime', 'ASC']],
          include: [
            {
              model: userMaster,
              as: 'userMaster',
            },
          ],
        });

        const Biometric_Integration = await biometricIntegration.findOne({
          where: {
            companyMasterID: companyMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          raw: true,
        });

        if (Biometric_Integration) {
          for (var i = 0; i < attendanceLog.length; i++) {
            console.log(
              'Validating Attendance of userID ',
              attendanceLog[i].userMasterID,
              ' of LogDateTime ',
              new Date(attendanceLog[i].logDateTime).toLocaleString()
            );

            const DifferenceOneMinuteOrAttendanceVerified =
              await differenceOneMinute(attendanceLog[i]);
            if (DifferenceOneMinuteOrAttendanceVerified) {
              await updateLogtoNC(attendanceLog[i].attendanceLogID, true);
              continue;
            }

            const empJoining = await EmployeeJoiningDetails.findOne({
              raw: true,
              where: {
                userMasterID: attendanceLog[i].userMasterID,
                status: 1,
              },
            });
            if (empJoining && empJoining.biometricSerialNo) {
              let allSerialNo = [];
              allSerialNo = empJoining.biometricSerialNo.split(',');

              for (
                var algo = 0;
                algo < Biometric_Integration.biometricSerialNo.length;
                algo++
              ) {
                if (
                  Biometric_Integration.biometricSerialNo[algo].trim() ==
                  allSerialNo[0].trim()
                ) {
                  if (+Biometric_Integration.algorithm[algo] == 2)
                    await singleMachineFILO(attendanceLog[i], req);
                  //Single Day Single Machine First IN Last Out
                  else if (+Biometric_Integration.algorithm[algo] == 3)
                    await multipleMachineFILO(attendanceLog[i], req);
                  //Single Day Multiple Machine First IN Last Out
                  else if (+Biometric_Integration.algorithm[algo] == 4)
                    await singleDaySingleMachineMInOut(attendanceLog[i], req);
                  //Single Day Single Machine Multiple IN OUT
                  else if (+Biometric_Integration.algorithm[algo] == 1)
                    await multipleDaySingleMachineMInOut(attendanceLog[i], req);
                  //Multiple Day Single Machine Multiple IN OUT
                  else if (+Biometric_Integration.algorithm[algo] == 5)
                    await singleDayMultipleMachineMultipleInOut(
                      attendanceLog[i],
                      req
                    );
                  //Single Day Multiple Machine Multiple In Out
                  else if (+Biometric_Integration.algorithm[algo] == 6)
                    await multipleDayMultipleMachineMultipleInOut(
                      attendanceLog[i],
                      req
                    );
                  //Multiple Day Multiple Machine Multiple In Out
                  else
                    console.log(
                      'algorithm not found',
                      attendanceLog[i].attendanceLogID
                    );

                  break;
                }
              }
            }
          }

          await ExecutionStatus.destroy({
            where: { companyMasterID: companyMasterID },
          });

          return res.status(200).json({
            status: 200,
            message: 'Attendance Validate Successfully.',
          });
        } else {
          await ExecutionStatus.destroy({
            where: {
              companyMasterID: companyMasterID,
            },
          });
          return res.status(200).json({
            status: 200,
            message: 'Biometric integration not found.',
          });
        }
      } else {
        return res.status(200).json({
          status: 200,
          message: 'Please add atleast one Shift',
        });
      }
    }
  } catch (err) {
    await ExecutionStatus.destroy({
      where: {
        companyMasterID: req.body.companyMasterID,
      },
    });
    next(err);
  }
};

//Multiple Day Multiple Machine Multiple In Out
async function multipleDayMultipleMachineMultipleInOut(log, req) {
  const date = asiaKolkataDateTime11(log.logDateTime);

  const checkDate = await checkattendanceDate(log, date);
  console.log(checkDate, 'checkdate');
  if (checkDate) {
    const findAttendance = await attendanceTransaction.findOne({
      where: {
        userMasterID: log.userMasterID,
        AttendanceDate: checkDate,
      },
    });

    console.log(findAttendance, 'findAttendance');

    if (!findAttendance) {
      if (log.direction == 'in') await createNewIn(log, date, req);
      else {
        await AttendanceLogs.update(
          { AttendanceTransID: attendaceTransType.biometricNC },
          { where: { attendanceLogID: log.attendanceLogID } }
        );
      }
    } else {
      await syncLogsmultipleDayMultipleMachineMultipleInOut(
        checkDate,
        log,
        req
      );
    }
  } else {
    await AttendanceLogs.update(
      { AttendanceTransID: attendaceTransType.biometricNC },
      { where: { attendanceLogID: log.attendanceLogID } }
    );
  }
}

async function syncLogsmultipleDayMultipleMachineMultipleInOut(date, log, req) {
  const findAttendance = await attendanceTransaction.findOne({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceDate: date,
    },
  });
  console.log(findAttendance, '--');
  const findAllLogs = findAttendance
    ? await AttendanceLogs.findAll({
        raw: true,
        where: {
          userMasterID: log.userMasterID,
          AttendanceTransID: findAttendance.AttendanceTransID,
        },
      })
    : [];
  console.log(findAllLogs, 'findAllLogs');

  let startTime,
    missPunchMinutes = 1320;
  if (
    new Date(date + ' ' + findAttendance.ShiftIntime) >
    new Date(log.logDateTime)
  )
    startTime = new Date(log.logDateTime);
  else startTime = new Date(date + ' ' + findAttendance.ShiftIntime);

  const endTime = new Date(date + ' ' + findAttendance.ShiftIntime).setMinutes(
    new Date(date + ' ' + findAttendance.ShiftIntime).getMinutes() +
      missPunchMinutes
  );
  console.log(endTime, new Date(date + ' ' + findAttendance.ShiftIntime));
  const findAllNCLogs = await AttendanceLogs.findAll({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      logDateTime: { [Sequelize.Op.between]: [startTime, endTime] },
      AttendanceTransID: attendaceTransType.biometricNC,
    },
  });
  console.log(findAllNCLogs, 'findAllNCLogs');
  findAllLogs.concat(findAllNCLogs);

  let flag = 0;
  for (var item of findAllLogs) {
    if (+item.attendanceLogID == +log.attendanceLogID) {
      flag = 1;
      break;
    }
  }
  if (flag == 0) findAllLogs.push(log);

  findAllLogs.sort((a, b) => new Date(a.logDateTime) - new Date(b.logDateTime));
  console.log(findAllLogs, 'alllogs');
  await destroyAttendance(log.userMasterID, date, true);
  var direction = 'in';
  for (var currlog of findAllLogs) {
    if (direction == 'in' && currlog.direction == 'in')
      await createNewIn(currlog, date, req), (direction = 'out');
    else if (direction == 'out' && currlog.direction == 'out')
      await createOut(currlog, date, req, true), (direction = 'continuein');
    else if (direction == 'continuein' && currlog.direction == 'in')
      await createContinueIn(currlog, date, req), (direction = 'out');
    else
      await AttendanceLogs.update(
        { AttendanceTransID: attendaceTransType.biometricNC },
        { where: { attendanceLogID: currlog.attendanceLogID } }
      );
  }
}

async function checkattendanceDate(log, date) {
  const pastDate = new Date(new Date(date) - 86400000)
    .toISOString()
    .slice(0, 10);
  console.log(pastDate, 'yes', date);

  const yesterdayAttendance = await attendanceTransaction.findOne({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceDate: pastDate,
    },
  });
  console.log(yesterdayAttendance, 'yes');
  // if (!yesterdayAttendance && log.direction == 'in') return date;
  // else if (!yesterdayAttendance && log.direction == 'out') return null;

  if (yesterdayAttendance) {
    const userAttendancePolicy = await employeeAttendancePolicy(
      log.userMasterID,
      yesterdayAttendance.AttendanceDate
    );

    let missPunchMinutes = 1320;
    if (userAttendancePolicy && userAttendancePolicy.missPunchMinutes)
      missPunchMinutes = +userAttendancePolicy.missPunchMinutes;

    const difference =
      (new Date(log.logDateTime).getTime() -
        new Date(
          yesterdayAttendance.AttendanceDate +
            ' ' +
            yesterdayAttendance.ShiftIntime
        ).getTime()) /
      (60 * 1000);
    console.log(difference, 'yes');

    if (+difference > +missPunchMinutes) return date;
    // else if (+difference > +missPunchMinutes && log.direction == 'out')
    //   return null;
    else return pastDate;
  } else return date;
}

//Single Day Multiple Machine Multiple In Out
async function singleDayMultipleMachineMultipleInOut(log, req) {
  if (!log.direction || (log.direction != 'in' && log.direction != 'out'))
    return;

  const date = asiaKolkataDateTime11(log.logDateTime);
  const checkLogStatus = await logStatusSingleDayMultipleMachineMultipleInOut(
    log,
    date
  ); //to check if the log is the Last log of the day and fits the cycle!!
  console.log(
    'Single Day Multiple Machine Multiple In Out---',
    log.direction,
    date,
    checkLogStatus
  );
  if (checkLogStatus) {
    if (log.direction == 'in') {
      if (checkLogStatus == 'newIN')
        await createNewIn(log, date, req); //new IN
      else await createContinueIn(log, date, req); //Continue IN
    } else if (log.direction == 'out') await createOut(log, date, req, true); //Create Out
  } else
    await revalidateAttendanceSingleDayMultipleMachineMInOut(log, date, req); //Revalidatin the attendance for the day according to the algorithm
}

//To Revalidate the Attendance for the day for algorithm - Single  Day Single Machine Multiple In Out
async function revalidateAttendanceSingleDayMultipleMachineMInOut(
  log,
  date,
  req
) {
  console.log('revalidating ', date);

  const allLogsArray = await getAllLogsSyncSingleDayMultipleMachineMInOut(
    log,
    date
  );
  console.log(allLogsArray, '---');
  await destroyAttendance(log.userMasterID, date, true);
  var direction = 'in';
  for (var currlog of allLogsArray) {
    if (direction == 'in' && currlog.direction == 'in')
      await createNewIn(currlog, date, req), (direction = 'out');
    else if (direction == 'out' && currlog.direction == 'out')
      await createOut(currlog, date, req, true), (direction = 'continuein');
    else if (direction == 'continuein' && currlog.direction == 'in')
      await createContinueIn(currlog, date, req), (direction = 'out');
    else
      await AttendanceLogs.update(
        { AttendanceTransID: attendaceTransType.biometricNC },
        { where: { attendanceLogID: currlog.attendanceLogID } }
      );
  }
}

async function getAllLogsSyncSingleDayMultipleMachineMInOut(log, date) {
  // const attendance = await attendanceTransaction.findOne({
  //   where: { userMasterID: log.userMasterID, AttendanceDate: date },
  // });
  const futureDate = new Date(new Date(date).getTime() + 86400000)
    .toISOString()
    .slice(0, 10);
  console.log('heererere', futureDate, date);

  const attendanceLogs = await AttendanceLogs.findAll({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceTransID: { [Sequelize.Op.ne]: 0 },
      [Sequelize.Op.and]: [
        {
          logDateTime: { [Sequelize.Op.gt]: date },
        },
        {
          logDateTime: { [Sequelize.Op.lt]: futureDate },
        },
      ],
    },
    order: [['logDateTime', 'ASC']],
  });
  console.log('heererere121212');

  const insertIndex = attendanceLogs.findIndex(
    (item) => new Date(item.logDateTime) > new Date(log.logDateTime)
  );

  if (insertIndex === -1) {
    // If the insertIndex is -1, it means the log should be inserted at the end.
    attendanceLogs.push(log);
  } else {
    // Insert the log at the correct chronological position.
    attendanceLogs.splice(insertIndex, 0, log);
  }

  return attendanceLogs;
}

async function logStatusSingleDayMultipleMachineMultipleInOut(log, date) {
  const futureDate = new Date(new Date(date).getTime() + 86400000)
    .toISOString()
    .slice(0, 10);

  const FutureNCLog = await AttendanceLogs.findOne({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceTransID: attendaceTransType.biometricNC,
      [Sequelize.Op.and]: [
        {
          logDateTime: { [Sequelize.Op.gt]: log.logDateTime },
        },
        {
          logDateTime: { [Sequelize.Op.lt]: futureDate },
        },
      ],
    },
  });
  console.log(FutureNCLog, 'future', futureDate, date);

  if (FutureNCLog) return false;

  const attendance = await attendanceTransaction.findOne({
    where: { userMasterID: log.userMasterID, AttendanceDate: date },
  });

  if (!attendance && log.direction == 'in') return 'newIN';
  if (!attendance && log.direction != 'in') return false;

  if (
    (log.direction == 'in' && !attendance.OutDateTime) ||
    (log.direction == 'out' && attendance.OutDateTime)
  )
    return false;

  const lastLogofTheDay = await AttendanceLogs.findOne({
    raw: true,
    where: { AttendanceTransID: attendance.AttendanceTransID },
    order: [['logDateTime', 'DESC']],
  });

  if (
    lastLogofTheDay &&
    new Date(lastLogofTheDay.logDateTime) < new Date(log.logDateTime)
  )
    return true;
  else return false;
}

//Multiple Day Single Machine Multiple IN OUT
async function multipleDaySingleMachineMInOut(log, req) {
  const futureValidatedLog = await AttendanceLogs.findOne({
    where: {
      userMasterID: log.userMasterID,
      AttendanceTransID: { [Sequelize.Op.notIn]: [0, 1] },
      logDateTime: { [Sequelize.Op.gt]: new Date(log.logDateTime) },
    },
  });

  const date = asiaKolkataDateTime11(log.logDateTime);

  if (futureValidatedLog) {
    //middle log
    await revalidateAttendanceMultipleDaySingleMachineMInOut(log, date, req);
  } else {
    //last log

    //In which direction this log should be considered
    const direction = await checkMDaysMIODirection(log, date);

    if (direction.direction == 'NEWIN') await createNewIn(log, date, req);
    else if (direction.direction == 'OUT')
      await createOut(log, direction.date, req);
    else if (direction.direction == 'CONTINUEIN')
      await createContinueIn(log, direction.date, req);
  }
}

//Single Day Single Machine Multiple IN OUT
async function singleDaySingleMachineMInOut(log, req) {
  const date = asiaKolkataDateTime11(log.logDateTime);

  //In which direction this log should be considered
  const direction = await checkMIODirection(log, date);
  if (direction == 'NEWIN') await createNewIn(log, date, req);
  else if (direction == 'OUT') await createOut(log, date, req, true);
  else if (direction == 'CONTINUEIN') await createContinueIn(log, date, req);
  else {
    await revalidateAttendanceSingleDaySingleMachineMInOut(log, date, req);
  }
}

//Single Day Multiple Machine First IN Last Out
async function multipleMachineFILO(log, req) {
  if (!log.direction) return;

  const date = asiaKolkataDateTime11(log.logDateTime);

  if (log.direction == 'in') {
    const checkLogStatus = await logStatus(log, date); //to check if the log is the first IN for the day!!

    if (checkLogStatus) {
      //to get the last log of he day
      const LastLog = await getLog(log.userMasterID, date, 'Last', 'out');

      //To destroy the current Attendance
      await destroyAttendance(log.userMasterID, date);

      //If the log is for first IN for the day
      await createNewIn(log, date, req);

      //If outLog Creating OUT
      if (LastLog) await createOut(LastLog, date, req, true);
    } else await updateLogtoNC(log.attendanceLogID); //If not update the log to Not consider
  } else if (log.direction == 'out') {
    const checkLogStatus = await logStatus(log, date); //to check if the log is the last OUT for the day!!
    if (checkLogStatus) {
      const attendance = await attendanceTransaction.findOne({
        where: { userMasterID: log.userMasterID, AttendanceDate: date },
      });

      if (!attendance) await updateLogtoNC(log.attendanceLogID); //If not update the log to Not consider

      //to get the first log of he day
      const FirstLog = await getLog(log.userMasterID, date, 'First', 'in');

      //Create Attendance with First & Last log of the day
      if (FirstLog) await createOut(log, date, req, true);

      //For converting middle logs of the days to NC
      await updateMiddleLogsToNC(log.userMasterID, date);
    } else await updateLogtoNC(log.attendanceLogID); //If not update the log to Not consider
  }
}

//Single Day Single Machine First IN Last Out
async function singleMachineFILO(log, req) {
  const date = asiaKolkataDateTime11(log.logDateTime);

  //In which direction this log should be considered
  const direction = await checkFILODirection(log, date);
  if (direction) {
    //If these is the first or last log of the day
    if (direction == 'IN') {
      //If First Log

      //to get the last log of he day
      const LastLog = await getLog(log.userMasterID, date, 'Last');

      //Create Attendance with First & Last log of the day
      if (!log) return;

      //To destroy the current Attendance
      await destroyAttendance(log.userMasterID, date);

      //Creating New IN
      await createNewIn(log, date, req);

      //If outLog Creating OUT
      if (LastLog) await createOut(LastLog, date, req, true);
    } else {
      //If Last Log

      //to get the first log of he day
      const FirstLog = await getLog(log.userMasterID, date, 'First');

      //Create Attendance with First & Last log of the day
      if (FirstLog) await createOut(log, date, req, true);

      //For converting middle logs of the days to NC
      await updateMiddleLogsToNC(log.userMasterID, date);
    }
  } else {
    //If these is the middle log of the day Convert log to Not Consider
    await updateLogtoNC(log.attendanceLogID);
  }
}

//To update the Log status to Not Consider
async function updateLogtoNC(logID, setSameDirection = false) {
  if (setSameDirection) {
    await AttendanceLogs.update(
      { AttendanceTransID: attendaceTransType.notConsider },
      { where: { attendanceLogID: logID } }
    );
  } else {
    await AttendanceLogs.update(
      {
        direction: attendanceTransactionType.notConsider.toLowerCase(),
        AttendanceTransID: attendaceTransType.notConsider,
      },
      { where: { attendanceLogID: logID } }
    );
  }
}

//To check the direction of the log for the ttdate
async function checkFILODirection(log, date) {
  const attendanceData = await attendanceTransaction.findOne({
    raw: true,
    where: { userMasterID: log.userMasterID, AttendanceDate: date },
    attributes: ['AttendanceTransID'],
  });

  if (!attendanceData) return 'IN';

  const pastLog = await AttendanceLogs.findOne({
    where: {
      userMasterID: log.userMasterID,
      AttendanceTransID: attendanceData.AttendanceTransID,
      logDateTime: { [Sequelize.Op.lte]: new Date(log.logDateTime) },
    },
  });

  const futureLog = await AttendanceLogs.findOne({
    where: {
      userMasterID: log.userMasterID,
      AttendanceTransID: attendanceData.AttendanceTransID,
      logDateTime: { [Sequelize.Op.gte]: new Date(log.logDateTime) },
    },
  });

  //If the current log lies between First & Last log of the day
  if (pastLog && futureLog) return null;

  //If all the logs are greater than the current log for the day
  if (!pastLog && futureLog) return 'IN';

  //If all the logs are less than the current log for the day
  if (pastLog && !futureLog) return 'OUT';

  //If no logs found -- very low possibility!!
  return null;
}

//To check the direction of the log for the ttdate
async function checkMIODirection(log, date) {
  const attendanceData = await attendanceTransaction.findOne({
    raw: true,
    where: { userMasterID: log.userMasterID, AttendanceDate: date },
    attributes: ['AttendanceTransID'],
  });

  if (!attendanceData) return 'NEWIN';

  const pastLog = await AttendanceLogs.findOne({
    where: {
      userMasterID: log.userMasterID,
      AttendanceTransID: attendanceData.AttendanceTransID,
      logDateTime: { [Sequelize.Op.lte]: new Date(log.logDateTime) },
    },
    order: [['logDateTime', 'DESC']],
  });

  const futureLog = await AttendanceLogs.findOne({
    where: {
      userMasterID: log.userMasterID,
      AttendanceTransID: attendanceData.AttendanceTransID,
      logDateTime: { [Sequelize.Op.gte]: new Date(log.logDateTime) },
    },
    order: [['logDateTime', 'ASC']],
  });

  //If all the logs are less than the current log for the day
  if (pastLog && !futureLog)
    return pastLog.direction == 'in' ? 'OUT' : 'CONTINUEIN';

  return null;
}

//To get the first or last log the day
async function getLog(userMasterID, date, type, direction = null) {
  const attendanceData = await attendanceTransaction.findOne({
    raw: true,
    where: { userMasterID: userMasterID, AttendanceDate: date },
    attributes: ['AttendanceTransID'],
  });

  if (!attendanceData) return null;

  const condition = {};
  condition.userMasterID = userMasterID;
  condition.AttendanceTransID = attendanceData.AttendanceTransID;

  if (direction) condition.direction = direction;

  if (type == 'Last') {
    return await AttendanceLogs.findOne({
      where: condition,
      order: [['logDateTime', 'DESC']],
    });
  } else {
    return await AttendanceLogs.findOne({
      where: condition,
      order: [['logDateTime', 'ASC']],
    });
  }
}

//to destroy Attendance of the user for the day
async function destroyAttendance(userMasterID, date, setSameDirection = false) {
  const attendanceData = await attendanceTransaction.findOne({
    raw: true,
    where: { userMasterID: userMasterID, AttendanceDate: date },
    attributes: ['AttendanceTransID', 'userMasterID', 'AttendanceDate'],
    include: { model: userMaster },
  });
  if (!attendanceData) return;

  if (setSameDirection) {
    await AttendanceLogs.update(
      { AttendanceTransID: attendaceTransType.biometricNC },
      { where: { AttendanceTransID: attendanceData.AttendanceTransID } }
    );
  } else {
    await AttendanceLogs.update(
      {
        direction: attendanceTransactionType.notConsider.toLowerCase(),
        AttendanceTransID: attendaceTransType.biometricNC,
      },
      { where: { AttendanceTransID: attendanceData.AttendanceTransID } }
    );
  }

  const overtimedata = await overTimeCalculation.findOne({
    where: {
      UserMasterID: attendanceData.userMasterID,
      OverTimeDate: attendanceData.AttendanceDate,
    },
  });

  if (overtimedata) {
    await OvertimeAuthorizationRequest.destroy({
      where: { ReferenceID: overtimedata.OverTimeID },
    });

    await overTimeCalculation.destroy({
      where: {
        UserMasterID: attendanceData.userMasterID,
        OverTimeDate: attendanceData.AttendanceDate,
      },
    });
  }
  let trans = await HrLeaveTypes.findOne({
    where: {
      LeaveID: 6,
      companyMasterID: attendanceData['userMaster.companyMasterId'],
    },
  });
  if (trans) {
    let YearMM = attendanceData.AttendanceDate.substring(0, 7);
    YearMM = YearMM.replace('-', '');
    const condition = {
      userMasterID: +attendanceData.userMasterID,
      LeaveCreatedDate: attendanceData.AttendanceDate,
    };
    let coff = await coffMaster.findOne({
      raw: true,
      where: condition,
    });
    if (coff) {
      if (coff.LeaveBalTranId) {
        await HrLeaveBalance.destroy({
          where: {
            LeaveBalTranId: coff.LeaveBalTranId,
          },
        });
      }

      if (coff.authorizationStatus != 0) {
        const authData = await CompensatoryOffAuthorization.findAll({
          where: {
            coffMasterID: coff.coffMasterID,
          },
        });

        const allIds = authData.map((e) => e.CompensatoryOffAuthorizationID);
        await UserInbox.destroy({
          where: {
            activityTable: CompensatoryOffAuthorization.getTableName(),
            activityTablePK: allIds,
          },
        });
        await CompensatoryOffAuthorization.destroy({
          where: {
            coffMasterID: coff.coffMasterID,
          },
        });

        await coffMaster.destroy({
          where: {
            userMasterID: attendanceData.userMasterID,
            LeaveCreatedDate: attendanceData.AttendanceDate,
          },
        });
      }
    }
  }

  await attendanceTransaction.destroy({
    where: { AttendanceTransID: attendanceData.AttendanceTransID },
  });
}

//creating attendance for NEW IN
async function createNewIn(log, date, req) {
  const userData = await UserMaster.findOne({
    where: {
      userMasterID: log.userMasterID,
    },
    include: [
      {
        required: false,
        separate: true,
        model: EmployeeAttendancePolicy,
        where: {
          status: 1,
          startDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        attributes: ['attendancePolicyID'],
        include: [{ model: AttendancePolicy, as: 'attendancePolicy' }],
      },
      {
        required: false,
        model: EmployeeBranch,
        where: {
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        attributes: ['branchID'],
      },
      {
        required: false,
        model: EmployeeDesignation,
        where: {
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
      },
      {
        model: EmployeeDepartment,
        where: {
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
      },
      {
        required: false,
        model: ShiftRoster,
        where: {
          status: 1,
          shiftRosterDate: new Date(date),
        },
      },
      {
        required: false,
        model: EmployeeShift,
        where: {
          status: 1,
          startDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
      },
    ],
    attributes: ['userMasterID'],
  });

  if (!userData) return;

  const userAttendancePolicy =
    userData.employeeAttendancePolicies?.[0]?.attendancePolicy || null;

  const employeeShift = userData.employeeShifts?.[0] || null;
  const employeeShiftRoster = userData.shiftRosters?.[0] || null;

  let userShift = await getShiftData(employeeShift, employeeShiftRoster, date); //Shift

  if (
    userAttendancePolicy &&
    userAttendancePolicy.automaticAssignShift == 0 &&
    !userShift
  )
    return;

  const userDepartment = userData.employeeDepartments?.[0] || null; //Department
  const userDesignation = userData.employeeDesignations?.[0] || null; //Designation
  const userBranch = userData.employeeBranches?.[0] || null; //Branch

  if (!userShift) {
    userShift = await getAutomticShiftAssigned(
      log.userMasterID,
      new Date(log.logDateTime)
    );
  }

  if (!userShift) return;

  const getShiftTime = await getshiftTimingbyShiftID(userShift.shiftID, date); //ShiftTiming
  const lateBy = await calculateLateby(
    date,
    getShiftTime.statTime,
    log.logDateTime
  ); //LateBy

  const attendanceData = await attendanceTransaction.create({
    userMasterID: log.userMasterID,
    departmentID: userDepartment ? userDepartment.departmentID : null,
    designationID: userDesignation ? userDesignation.designationID : null,
    branchID: userBranch ? userBranch.branchID : null,
    InDatetime: new Date(log.logDateTime),
    AttendanceDate: date,
    Shift: userShift.shiftID,
    Shifthrs: getShiftTime.totalhours,
    ShiftIntime: getShiftTime.statTime,
    ShiftoutTime: getShiftTime.endtime,
    LateBy: lateBy,
    createBy: req.body.createBy,
    createByIp: req.body.createByIp,
  });

  await AttendanceLogs.update(
    {
      AttendanceTransID: attendanceData.AttendanceTransID,
      direction: attendanceDirection.IN,
      updateBy: req.body.createBy,
    },
    { where: { attendanceLogID: log.attendanceLogID } }
  );

  // if shift roster is not available

  if (!employeeShiftRoster && attendanceData) {
    await ShiftRoster.create(
      {
        userMasterID: attendanceData.userMasterID,
        shiftID: attendanceData.Shift,
        shiftRosterDate: attendanceData.AttendanceDate,
        createBy: req.body.createBy,
        createByIp: req.body.createByIp,
      },
      { hooks: false }
    );
  }
}

//creating attendance for OUT
async function createOut(log, date, req, monthlyPenalty = null) {
  //attendance for out
  const attendance = await attendanceTransaction.findOne({
    where: { userMasterID: log.userMasterID, AttendanceDate: date },
  });

  if (!attendance) return;

  //Finding InHrs for the day
  let totaltime = Math.round(
    (new Date(log.logDateTime).getTime() -
      new Date(attendance.InDatetime).getTime()) /
      (60 * 1000)
  );

  //Condition of Akshay Enterprise
  if (
    +req.body.companyMasterID == 168 &&
    new Date(attendance.InDatetime) <
      new Date(attendance.AttendanceDate + ' ' + attendance.ShiftIntime)
  ) {
    const difference = Math.abs(
      (new Date(attendance.AttendanceDate + ' ' + attendance.ShiftIntime) -
        new Date(attendance.InDatetime)) /
        (1000 * 60)
    );
    totaltime = Math.round(totaltime - +difference);
  }

  const InHrs = totaltime - +attendance.OutHrs;
  //Finding totaltime for the day according to attendance policy
  const userAttendancePolicy = await employeeAttendancePolicy(
    log.userMasterID,
    date
  ); //AttendancePolicy

  // get finalminutes

  let finalMinutes = +totaltime;

  let skipMinutes = 0;
  if (userAttendancePolicy) {
    if (userAttendancePolicy.considerWorkingHours != 'includingouthours') {
      totaltime = InHrs;
      finalMinutes = InHrs;
    }

    // preshift hours consideration

    if (
      userAttendancePolicy.considerOvertimeAfter == 'totalworkinghours' &&
      userAttendancePolicy.preShiftHrsConsideration == 0
    ) {
      if (
        new Date(attendance.InDatetime) <
        new Date(attendance.AttendanceDate + ' ' + attendance.ShiftIntime)
      ) {
        const diffMilliseconds =
          new Date(attendance.AttendanceDate + ' ' + attendance.ShiftIntime) -
          new Date(attendance.InDatetime);

        skipMinutes = Math.floor(diffMilliseconds / (1000 * 60));
        // skip minutes from fulldayhalfday minutes

        totaltime -= +skipMinutes;
      }
    }
  }

  //Finding Earlyby for the day
  const earlyBy = await calculateEarlyby(
    date,
    attendance.ShiftIntime,
    attendance.ShiftoutTime,
    log.logDateTime
  ); //EarlyBy

  const shift = await Shift.findOne({
    where: { shiftID: attendance.Shift },
  });

  //Adding Grace time
  if (shift && shift.shiftGrace) totaltime += +shift.shiftGrace;

  const day = new Date(date).toLocaleString('en-us', { weekday: 'long' });

  //Calculating Attendance Status
  const fulldayhalfday = await executeQuery(
    'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
      attendance.Shift +
      ',' +
      "'" +
      day +
      "'" +
      ',' +
      totaltime +
      ')'
  );

  const userSalaryPolicy = await employeeSalaryPolicy(log.userMasterID, date); //salaryPolicy

  // set roundoff minutes

  let final_Minutes = totaltime;

  if (
    userSalaryPolicy &&
    userSalaryPolicy['salaryPolicy.salarycalculationBasedon'] == 'hourwise' &&
    userSalaryPolicy['salaryPolicy.considerTimeType'] != 'actual'
  ) {
    if (userSalaryPolicy['salaryPolicy.considerTimeValue']) {
      if (userSalaryPolicy['salaryPolicy.considerTimeType'] == 'slotwise') {
        final_Minutes =
          Math.floor(
            Math.round(+final_Minutes) /
              +userSalaryPolicy['salaryPolicy.considerTimeValue']
          ) * +userSalaryPolicy['salaryPolicy.considerTimeValue'];
      }

      if (userSalaryPolicy['salaryPolicy.considerTimeType'] == 'roundoff') {
        final_Minutes =
          roundToNearestHour(
            Math.round(+final_Minutes),
            +userSalaryPolicy['salaryPolicy.considerTimeValue']
          ) * 60;
      }
    }
  }

  await attendanceTransaction.update(
    {
      OutDateTime: new Date(log.logDateTime),
      InHrs: InHrs,
      EarlyBy: earlyBy ? earlyBy : null,
      fulldayhalfday: +fulldayhalfday[0].fulldayhalfday,
      roundOffMinutes: +final_Minutes > 0 ? final_Minutes : 0,
    },
    { where: { AttendanceTransID: attendance.AttendanceTransID } }
  );

  await AttendanceLogs.update(
    {
      AttendanceTransID: attendance.AttendanceTransID,
      direction: attendanceDirection.OUT,
      updateBy: req.body.createBy,
    },
    { where: { attendanceLogID: log.attendanceLogID } }
  );

  //Checking Holiday for the day
  const isHoliday = await checkHoliday(log.userMasterID, date);

  //If Holiday adding Coff or overtime (**if applicable)
  if (isHoliday == 1 && userAttendancePolicy && userAttendancePolicy.coff) {
    const totalTime =
      shift && shift.shiftGrace ? totaltime - +shift.shiftGrace : totaltime;
    if (userAttendancePolicy.coff == 'Overtime')
      await coffOvertime(
        log.userMasterID,
        attendance.AttendanceTransID,
        totalTime,
        skipMinutes
      );
    else if (
      userAttendancePolicy.coff == 'AddLeave' &&
      userAttendancePolicy.coffhalfday &&
      userAttendancePolicy.cofffullday
    ) {
      const totaltimeHrs = +totalTime / 60;
      if (
        totaltimeHrs >= +userAttendancePolicy.coffhalfday &&
        totaltimeHrs < +userAttendancePolicy.cofffullday
      )
        await addCoff(
          log.userMasterID,
          date,
          0.5,
          req.body.createBy,
          req.body.createByIp
        );
      else if (totaltimeHrs >= +userAttendancePolicy.cofffullday)
        await addCoff(
          log.userMasterID,
          date,
          1,
          req.body.createBy,
          req.body.createByIp
        );
    }
  } else {
    const earlyattendancetransaction = await attendanceTransaction.findOne({
      where: { AttendanceTransID: attendance.AttendanceTransID },
    });

    if (monthlyPenalty) {
      await lateEarlyPenaltyManual(earlyattendancetransaction);
      // await penalty_deductionManual(earlyattendancetransaction);
      // await earlyby_deductionManual(earlyattendancetransaction);
    } else {
      //Early by Penalty or go early used
      const LateEarlyPolicy = await employeeLateEarlyPolicy(
        earlyattendancetransaction.userMasterID,
        earlyattendancetransaction.AttendanceDate
      );

      // Flag To add Onworking hours

      const toaddOnWorkingHours = LateEarlyPolicy
        ? LateEarlyPolicy['lateEarlyPolicy.onWorkingHours']
        : false;

      const finalAdd_LCEG =
        toaddOnWorkingHours &&
        +finalMinutes >= +earlyattendancetransaction.Shifthrs * 60
          ? false
          : true;

      if (
        LateEarlyPolicy &&
        LateEarlyPolicy['lateEarlyPolicy.lateEarlyPolicyType'] == 'combined'
      ) {
        await combined_deductionMobile(
          earlyattendancetransaction,
          shift,
          totaltime,
          finalAdd_LCEG
        );
      } else {
        const goEarlyUsed = await earlyByPermission(
          earlyattendancetransaction,
          shift,
          earlyBy,
          totaltime,
          finalAdd_LCEG
        );

        if (goEarlyUsed && +goEarlyUsed == 1) {
          const updatedFulldayHalfDay = +totaltime + +shift.goEarly;

          const fulldayhalfday = await executeQuery(
            'select * from public.MS_Fun_FullDayHalfDayCalculation(' +
              attendance.Shift +
              ',' +
              "'" +
              day +
              "'" +
              ',' +
              updatedFulldayHalfDay +
              ')'
          );

          await attendanceTransaction.update(
            {
              goEarlyUsed: 1,
              fulldayhalfday: +fulldayhalfday[0].fulldayhalfday,
            },
            { where: { AttendanceTransID: attendance.AttendanceTransID } }
          );
        }

        const lateattendancetransaction = await attendanceTransaction.findOne({
          where: { AttendanceTransID: attendance.AttendanceTransID },
        });

        //Late coming penalty
        await lateComingPenalty(
          lateattendancetransaction,
          shift,
          totaltime,
          finalAdd_LCEG
        );
      }
    }

    //Overtime
    await overtime(log.userMasterID, attendance.AttendanceTransID, skipMinutes);
  }

  let finaltransation = await attendanceTransaction.findOne({
    where: {
      AttendanceTransID: attendance.AttendanceTransID,
    },
  });
  await addFoodAllowanceInAttendance(finaltransation);
}

//creating attendance for continue IN
async function createContinueIn(log, date, req) {
  //attendance for out
  const attendance = await attendanceTransaction.findOne({
    where: { userMasterID: log.userMasterID, AttendanceDate: date },
  });

  if (!attendance || !attendance.OutDateTime) return;

  await destroyOldCoffOvertime(log.userMasterID, date);

  const OutHrs =
    +attendance.OutHrs +
    Math.round(
      (new Date(log.logDateTime).getTime() -
        new Date(attendance.OutDateTime).getTime()) /
        (60 * 1000)
    );

  if (
    +req.body.companyMasterID == 277 ||
    +req.body.companyMasterID == 298 ||
    +req.body.companyMasterID == 300
  ) {
    await attendanceTransaction.update(
      {
        OutDateTime: null,
        OutHrs: OutHrs,
        EarlyBy: null,
        Panalty: null,
        PanaltyDeduction: null,
        goEarlyPanalty: null,
        goEarlyPanaltyDeduction: null,
        fulldayhalfday: null,
        punchOUTbranch: null,
        locationTypeOUT: null,
        roundOffMinutes: null,
      },
      { where: { AttendanceTransID: attendance.AttendanceTransID } }
    );

    const penaltyID =
      +req.body.companyMasterID == 277
        ? 90
        : +req.body.companyMasterID == 298
          ? 166
          : 201;
    const breakTime = await addAsopalavBreakTime(
      attendance,
      new Date(log.logDateTime)
    );

    const totalBreakTime =
      new Date(attendance.AttendanceDate + ' 09:35 AM') >
      new Date(attendance.InDatetime)
        ? 90
        : 45;

    if (breakTime.type == 'teabreak') {
      if (breakTime.diff + attendance.lunchBreak > totalBreakTime)
        await addAsopalavBreakTimePenalty(
          log.userMasterID,
          attendance.AttendanceDate,
          penaltyID
        );

      await attendanceTransaction.update(
        {
          teaBreak: breakTime.diff,
          teaBreakInStartTime: breakTime.starttime,
          teaBreakEndTime: breakTime.endtime,
        },
        { where: { AttendanceTransID: attendance.AttendanceTransID } }
      );
    } else if (breakTime.type == 'lunchBreak') {
      if (breakTime.diff > totalBreakTime)
        await addAsopalavBreakTimePenalty(
          log.userMasterID,
          attendance.AttendanceDate,
          penaltyID
        );

      await attendanceTransaction.update(
        {
          lunchBreak: breakTime.diff,
          lunchBreakStartTime: breakTime.starttime,
          lunchBreakEndTime: breakTime.endtime,
        },
        { where: { AttendanceTransID: attendance.AttendanceTransID } }
      );
    }
  } else {
    await attendanceTransaction.update(
      {
        OutDateTime: null,
        OutHrs: OutHrs,
        EarlyBy: null,
        Panalty: null,
        PanaltyDeduction: null,
        goEarlyPanalty: null,
        goEarlyPanaltyDeduction: null,
        fulldayhalfday: null,
        punchOUTbranch: null,
        locationTypeOUT: null,
        roundOffMinutes: null,
      },
      { where: { AttendanceTransID: attendance.AttendanceTransID } }
    );
  }

  await AttendanceLogs.update(
    {
      AttendanceTransID: attendance.AttendanceTransID,
      direction: attendanceDirection.IN,
      updateBy: req.body.createBy,
    },
    { where: { attendanceLogID: log.attendanceLogID } }
  );
}

//to check if this log
async function logStatus(log, date) {
  if (log.direction == 'in') {
    const FirstLog = await getLog(log.userMasterID, date, 'First', 'in');

    if (!FirstLog) return true;
    else if (new Date(FirstLog.logDateTime) > new Date(log.logDateTime))
      return true;
  } else if (log.direction == 'out') {
    const LastLog = await getLog(log.userMasterID, date, 'Last', 'out');
    if (!LastLog) return true;
    else if (new Date(LastLog.logDateTime) < new Date(log.logDateTime))
      return true;
  }

  return false;
}

//To destroy Old Coff & Overtime for continue punch IN
async function destroyOldCoffOvertime(userMasterID, date) {
  const get_coff = await coffMaster.findOne({
    where: {
      userMasterID: userMasterID,
      LeaveCreatedDate: date,
      status: 1,
    },
  });

  if (get_coff) {
    if (get_coff.LeaveBalTranId) {
      await hrLeaveBalances.destroy({
        where: { LeaveBalTranId: get_coff.LeaveBalTranId },
      });

      await coffMaster.destroy({
        where: {
          userMasterID: userMasterID,
          LeaveCreatedDate: date,
          status: 1,
        },
      });
    } else {
      await coffMaster.destroy({
        where: {
          userMasterID: userMasterID,
          LeaveCreatedDate: date,
          status: 1,
        },
      });
    }
  }

  await deleteOvertimeForAttendance(userMasterID, date);

  // const overtimedata = await overTimeCalculation.findOne({
  //   where: {
  //     UserMasterID: userMasterID,
  //     OverTimeDate: date,
  //   },
  // });

  // if (overtimedata) {
  //   await OvertimeAuthorizationRequest.destroy({
  //     where: { ReferenceID: overtimedata.OverTimeID },
  //   });

  //   await overTimeCalculation.destroy({
  //     where: {
  //       UserMasterID: userMasterID,
  //       OverTimeDate: date,
  //     },
  //   });
  // }

  //to remove overtime in continue punch in
  // await overTimeCalculation.destroy({
  //   where: {
  //     UserMasterID: userMasterID,
  //     OverTimeDate: date,
  //   },
  // });
}

//To Revalidate the Attendance for the day for algorithm - Single  Day Single Machine Multiple In Out
async function revalidateAttendanceSingleDaySingleMachineMInOut(
  log,
  date,
  req
) {
  const allLogsArray = await getAllLogsSync(log, date);

  await destroyAttendance(log.userMasterID, date);
  var direction = 'in';
  for (var currlog of allLogsArray) {
    if (direction == 'in')
      await createNewIn(currlog, date, req), (direction = 'out');
    else if (direction == 'out')
      await createOut(currlog, date, req, true), (direction = 'continuein');
    else await createContinueIn(currlog, date, req), (direction = 'out');
  }
}

//To get the sorted log array for the day
async function getAllLogsSync(log, date) {
  const attendance = await attendanceTransaction.findOne({
    where: { userMasterID: log.userMasterID, AttendanceDate: date },
  });

  const attendanceLogs = await AttendanceLogs.findAll({
    raw: true,
    where: { AttendanceTransID: attendance.AttendanceTransID },
    order: [['logDateTime', 'ASC']],
  });

  const insertIndex = attendanceLogs.findIndex(
    (item) => new Date(item.logDateTime) > new Date(log.logDateTime)
  );

  if (insertIndex === -1) {
    // If the insertIndex is -1, it means the log should be inserted at the end.
    attendanceLogs.push(log);
  } else {
    // Insert the log at the correct chronological position.
    attendanceLogs.splice(insertIndex, 0, log);
  }

  // attendanceLogs.splice(
  //   attendanceLogs.findIndex((item) => item.logDateTime > log.logDateTime),
  //   0,
  //   log
  // );

  return attendanceLogs;
}

//To check the direction of the log for the Multiple days
async function checkMDaysMIODirection(log, date) {
  const pastDate = new Date(new Date(date) - 86400000)
    .toISOString()
    .slice(0, 10);

  const attendance = await attendanceTransaction.findOne({
    where: {
      userMasterID: log.userMasterID,
      [Sequelize.Op.or]: [
        { AttendanceDate: pastDate },
        { AttendanceDate: date },
      ],
    },
    order: [['AttendanceDate', 'DESC']],
  });

  if (!attendance) return { direction: attendanceDirection.NEWIN, date: null };

  const userAttendancePolicy = await employeeAttendancePolicy(
    log.userMasterID,
    attendance.AttendanceDate
  );

  let missPunchMinutes = 1320;
  if (userAttendancePolicy && userAttendancePolicy.missPunchMinutes)
    missPunchMinutes = +userAttendancePolicy.missPunchMinutes;

  const difference =
    (new Date(log.logDateTime).getTime() -
      new Date(
        attendance.AttendanceDate + ' ' + attendance.ShiftIntime
      ).getTime()) /
    (60 * 1000);

  if (+difference > +missPunchMinutes && date != attendance.AttendanceDate)
    return { direction: attendanceDirection.NEWIN, date: null };

  if (
    +difference <= 0 ||
    (+difference > +missPunchMinutes && date == attendance.AttendanceDate)
  ) {
    await updateLogtoNC(log.attendanceLogID);
    return { direction: null, date: null };
  }

  return {
    direction: attendance.OutDateTime
      ? attendanceDirection.CONTINUEIN
      : attendanceDirection.OUT,
    date: attendance.AttendanceDate,
  };
}

//To check the direction of the log for the Multiple days of Future
async function checkMDaysMIODirectionFuture(log, date) {
  const pastDate = new Date(new Date(date) - 86400000)
    .toISOString()
    .slice(0, 10);

  const yesterdayAttendance = await attendanceTransaction.findOne({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceDate: pastDate,
    },
  });

  const todayAttendance = await attendanceTransaction.findOne({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceDate: date,
    },
  });

  if (!yesterdayAttendance && !todayAttendance)
    return { direction: attendanceDirection.NEWIN, date: null };

  const userAttendancePolicy = await employeeAttendancePolicy(
    log.userMasterID,
    date
  );

  let missPunchMinutes = 1320;
  if (userAttendancePolicy && userAttendancePolicy.missPunchMinutes)
    missPunchMinutes = +userAttendancePolicy.missPunchMinutes;

  if (yesterdayAttendance) {
    const yesterdayDifference =
      (new Date(log.logDateTime).getTime() -
        new Date(
          yesterdayAttendance.AttendanceDate +
            ' ' +
            yesterdayAttendance.ShiftIntime
        ).getTime()) /
      (60 * 1000);

    if (+yesterdayDifference > +missPunchMinutes) {
      if (!todayAttendance)
        return { direction: attendanceDirection.NEWIN, date: null };
    } else {
      if (+yesterdayDifference <= 0) {
        await updateLogtoNC(log.attendanceLogID);
        return { direction: null, date: null };
      }

      const recentLog = await AttendanceLogs.findOne({
        raw: true,
        where: {
          userMasterID: log.userMasterID,
          AttendanceTransID: yesterdayAttendance.AttendanceTransID,
          logDateTime: {
            [Sequelize.Op.gte]: new Date(log.logDateTime),
          },
        },
      });

      if (recentLog) {
        await updateLogtoNC(log.attendanceLogID);
        return { direction: null, date: null };
      } else {
        return {
          direction: yesterdayAttendance.OutDateTime
            ? attendanceDirection.CONTINUEIN
            : attendanceDirection.OUT,
          date: yesterdayAttendance.AttendanceDate,
        };
      }
    }
  }

  if (todayAttendance) {
    const todayDifference =
      (new Date(log.logDateTime).getTime() -
        new Date(
          todayAttendance.AttendanceDate + ' ' + todayAttendance.ShiftIntime
        ).getTime()) /
      (60 * 1000);

    if (+todayDifference > +missPunchMinutes || +todayDifference <= 0) {
      await updateLogtoNC(log.attendanceLogID);
      return { direction: null, date: null };
    }

    const recentLog = await AttendanceLogs.findOne({
      raw: true,
      where: {
        userMasterID: log.userMasterID,
        AttendanceTransID: todayAttendance.AttendanceTransID,
        logDateTime: {
          [Sequelize.Op.gte]: new Date(log.logDateTime),
        },
      },
    });

    if (recentLog) {
      await updateLogtoNC(log.attendanceLogID);
      return { direction: null, date: null };
    } else {
      return {
        direction: todayAttendance.OutDateTime
          ? attendanceDirection.CONTINUEIN
          : attendanceDirection.OUT,
        date: todayAttendance.AttendanceDate,
      };
    }
  }
}

//To Revalidate the Attendance for algorithm - Multiple Day Single Machine Multiple In Out
async function revalidateAttendanceMultipleDaySingleMachineMInOut(
  log,
  date,
  req
) {
  const pastDate = new Date(new Date(date) - 86400000)
    .toISOString()
    .slice(0, 10);

  const yesterDayAttendance = await attendanceTransaction.findOne({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceDate: pastDate,
    },
  });

  const todayAttendance = await attendanceTransaction.findOne({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceDate: date,
    },
  });

  const allFutureAttendance = await attendanceTransaction.findAll({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      AttendanceDate: { [Sequelize.Op.gt]: date },
    },
    order: [['AttendanceDate', 'ASC']],
  });

  if (todayAttendance) allFutureAttendance.unshift(todayAttendance);
  if (yesterDayAttendance) allFutureAttendance.unshift(yesterDayAttendance);

  let allLogs = [];
  for (const currAttendance of allFutureAttendance) {
    const attendanceLogs = await AttendanceLogs.findAll({
      raw: true,
      where: { AttendanceTransID: currAttendance.AttendanceTransID },
      order: [['logDateTime', 'ASC']],
    });

    allLogs = allLogs.concat(attendanceLogs);
    await destroyAttendance(
      currAttendance.userMasterID,
      currAttendance.AttendanceDate
    );
  }

  const insertIndex = allLogs.findIndex(
    (item) => new Date(item.logDateTime) > new Date(log.logDateTime)
  );

  if (insertIndex === -1) {
    // If the insertIndex is -1, it means the log should be inserted at the end.
    allLogs.push(log);
  } else {
    // Insert the log at the correct chronological position.
    allLogs.splice(insertIndex, 0, log);
  }

  // allLogs.splice(
  //   allLogs.findIndex((item) => item.logDateTime > log.logDateTime),
  //   0,
  //   log
  // );

  for (const currLog of allLogs) {
    await multipleDaySingleMachineMInOutRevalidate(currLog, req);
  }
}

//Multiple Day Single Machine Multiple IN OUT
async function multipleDaySingleMachineMInOutRevalidate(log, req) {
  // const futureValidatedLog = await AttendanceLogs.findOne({
  //   where: {
  //     userMasterID: log.userMasterID,
  //     AttendanceTransID: { [Sequelize.Op.notIn]: [0, 1] },
  //     logDateTime: { [Sequelize.Op.gt]: new Date(log.logDateTime) },
  //   },
  // });

  console.log(
    'Re-validating Attendance of userID ',
    log.userMasterID,
    ' of LogDateTime ',
    new Date(log.logDateTime).toLocaleString()
  );

  const date = asiaKolkataDateTime11(log.logDateTime);

  // if (futureValidatedLog) {
  //middle log
  // await revalidateAttendanceMultipleDaySingleMachineMInOut(log, date, req);
  // } else {
  //last log

  //In which direction this log should be considered
  const direction = await checkMDaysMIODirectionFuture(log, date);

  if (direction.direction == 'NEWIN') await createNewIn(log, date, req);
  else if (direction.direction == 'OUT')
    await createOut(log, direction.date, req);
  else if (direction.direction == 'CONTINUEIN')
    await createContinueIn(log, direction.date, req);
  // }
}

const options = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

exports.biometricTestingAPI = async (req, res, next) => {
  try {
    const attendance = await attendanceTransaction.findAll({
      where: { AttendanceTransID: 3113312 },
      raw: true,
    });

    for (var item of attendance) {
      const allLogs = await AttendanceLogs.findAll({
        where: { AttendanceTransID: item.AttendanceTransID },
        raw: true,
      });
    }

    return res.status(200).json({
      status: 200,
      data: 'Done....',
    });
  } catch (err) {
    next(err);
  }
};

const asiaKolkataDateTime11 = (datetime) =>
  asiaKolkataDateTime(datetime).slice(0, 10);

// const asiaKolkataDateTime11 = (datetime) =>
//   new Date(datetime).toISOString().slice(0, 10);

async function updateMiddleLogsToNC(userMasterID, date) {
  const attendance = await attendanceTransaction.findOne({
    where: { userMasterID: userMasterID, AttendanceDate: date },
    raw: true,
  });

  if (!attendance) return;

  const attendanceLogs = await AttendanceLogs.findAll({
    where: { AttendanceTransID: attendance.AttendanceTransID },
    raw: true,
    order: [['logDateTime', 'ASC']],
  });

  if (attendanceLogs.length > 2) {
    for (let i = 1; i < attendanceLogs.length - 1; i++) {
      await updateLogtoNC(attendanceLogs[i].attendanceLogID);
    }
  }
}

async function differenceOneMinute(log) {
  const AttendanceLog = await AttendanceLogs.findOne({
    where: {
      userMasterID: log.userMasterID,
      logDateTime: {
        [Sequelize.Op.between]: [
          new Date(log.logDateTime).setSeconds(
            new Date(log.logDateTime).getSeconds() - 60
          ),
          new Date(log.logDateTime).setSeconds(
            new Date(log.logDateTime).getSeconds() + 60
          ),
        ],
      },
      AttendanceTransID: { [Sequelize.Op.notIn]: [0, 1] },
      attendanceLogID: { [Sequelize.Op.ne]: log.attendanceLogID },
    },
    raw: true,
  });

  if (AttendanceLog) return true;

  const date = asiaKolkataDateTime11(log.logDateTime);

  const AttendanceVerified = await HrLeaveMonthlyTrans.findOne({
    raw: true,
    where: {
      userMasterID: log.userMasterID,
      verified: 1,
      // monthenddate: { [Sequelize.Op.gte]: new Date(log.logDateTime).toISOString().slice(0, 10) },
      [Sequelize.Op.and]: [
        sequelize.literal(`TO_DATE("monthenddate", 'YYYY-MM-DD') >= '${date}'`),
        // sequelize.literal(
        //   `TO_DATE("monthstartdate", 'YYYY-MM-DD') <= '${date}'`
        // ),
      ],
    },
  });
  if (AttendanceVerified) return true;

  return false;
}

async function heerabiometricSync(id, result) {
  const get_one_data = await biometricIntegration.findOne({
    where: {
      companyMasterID: id,
      status: {
        [Sequelize.Op.in]: [0, 1],
      },
    },
    raw: true,
  });

  const LastBiometricLog = await AttendanceLogs.findOne({
    raw: true,
    where: {
      '$userMaster.companyMasterId$': id,
      attendnaceFrom: 'biometric',
    },
    order: [['logDateTime', 'DESC']],
    include: [{ model: UserMaster }],
  });

  let createBy, createByIp;

  if (LastBiometricLog) {
    createBy = LastBiometricLog.createBy;
    createByIp = LastBiometricLog.createByIp;
  } else {
    createBy = 74671;
    createByIp = '113.193.179.19';
  }

  // console.log(id, createBy, createByIp, get_one_data, result, '---');
  let returnReference = '';

  try {
    if (!get_one_data) return;
    for (var i = 0; i < result.length; i++) {
      console.log(i, 'i');
      // for (var j = 0; j < get_one_data.biometricSerialNo.length; j++) {

      const joiningdata = await EmployeeJoiningDetails.findOne({
        raw: true,
        where: {
          biometricCode: result[i].EmployeeCode,
          '$userMaster.companyMasterId$': id,
          leavingDate: {
            [Sequelize.Op.eq]: null,
          },
          biometricSerialNo: {
            [Sequelize.Op.iLike]: '%' + result[i].ReaderId.trim() + '%',
          },
          '$userMaster.status$': 1,
          status: 1,
        },
        include: [{ model: userMaster, as: 'userMaster' }],
      });

      if (joiningdata && result[i].ReaderId && joiningdata.biometricSerialNo) {
        result[i].ReaderId = result[i].ReaderId.trim();
        var arr_assign_biometric = joiningdata.biometricSerialNo.split(',');
        var flag = 0;
        for (var k = 0; k < arr_assign_biometric.length; k++) {
          if (arr_assign_biometric[k])
            arr_assign_biometric[k] = arr_assign_biometric[k].trim();
          if (arr_assign_biometric[k] == result[i].ReaderId) {
            flag = 1;
            break;
          }
        }
        console.log(flag, 'flag');
        if (flag == 1) {
          let direction = '';

          await AttendanceLogs.create({
            userMasterID: joiningdata.userMasterID,
            AttendanceTransID: attendaceTransType.biometricNotValidated,
            logDateTime: new Date(result[i].LogDateTime),
            direction: direction,
            photo: '',
            attendnaceFrom: 'biometric',
            longitude: '',
            latitude: '',
            address: '',
            createBy: createBy,
            createByIp: createByIp,
          });

          returnReference += result[i].RecordNumber.toString() + ',';
        }
      }
      // }
    }

    return returnReference;
  } catch (err) {
    console.log(err);
    return;
  }
}

async function heerabiometricValidate(companyMasterID, createBy, createByIp) {
  try {
    const req = {
      body: {
        companyMasterID: companyMasterID,
        createBy: createBy,
        createByIp: createByIp,
      },
    };

    const company_Shift = await shiftModel.findOne({
      where: { companyMasterID: companyMasterID, status: 1 },
    });

    if (company_Shift) {
      const attendanceLog = await AttendanceLogs.findAll({
        raw: true,
        where: {
          '$userMaster.companyMasterId$': companyMasterID,
          AttendanceTransID: attendaceTransType.biometricNotValidated,
        },
        order: [['logDateTime', 'ASC']],
        include: [
          {
            model: userMaster,
            as: 'userMaster',
          },
        ],
      });

      const Biometric_Integration = await biometricIntegration.findOne({
        where: {
          companyMasterID: companyMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        raw: true,
      });

      if (Biometric_Integration) {
        for (var i = 0; i < attendanceLog.length; i++) {
          console.log(
            'Validating Attendance of userID ',
            attendanceLog[i].userMasterID,
            ' of LogDateTime ',
            new Date(attendanceLog[i].logDateTime).toLocaleString()
          );

          const DifferenceOneMinuteOrAttendanceVerified =
            await differenceOneMinute(attendanceLog[i]);
          if (DifferenceOneMinuteOrAttendanceVerified) {
            await updateLogtoNC(attendanceLog[i].attendanceLogID, true);
            continue;
          }

          const empJoining = await EmployeeJoiningDetails.findOne({
            raw: true,
            where: {
              userMasterID: attendanceLog[i].userMasterID,
              status: 1,
            },
          });
          if (empJoining && empJoining.biometricSerialNo) {
            let allSerialNo = [];
            allSerialNo = empJoining.biometricSerialNo.split(',');

            for (
              var algo = 0;
              algo < Biometric_Integration.biometricSerialNo.length;
              algo++
            ) {
              if (
                Biometric_Integration.biometricSerialNo[algo].trim() ==
                allSerialNo[0].trim()
              ) {
                if (+Biometric_Integration.algorithm[algo] == 2)
                  await singleMachineFILO(attendanceLog[i], req);
                //Single Day Single Machine First IN Last Out
                else if (+Biometric_Integration.algorithm[algo] == 3)
                  await multipleMachineFILO(attendanceLog[i], req);
                //Single Day Multiple Machine First IN Last Out
                else if (+Biometric_Integration.algorithm[algo] == 4)
                  await singleDaySingleMachineMInOut(attendanceLog[i], req);
                //Single Day Single Machine Multiple IN OUT
                else if (+Biometric_Integration.algorithm[algo] == 1)
                  await multipleDaySingleMachineMInOut(attendanceLog[i], req);
                //Multiple Day Single Machine Multiple IN OUT
                else if (+Biometric_Integration.algorithm[algo] == 5)
                  await singleDayMultipleMachineMultipleInOut(
                    attendanceLog[i],
                    req
                  );
                //Single Day Multiple Machine Multiple In Out
                else if (+Biometric_Integration.algorithm[algo] == 6)
                  await multipleDayMultipleMachineMultipleInOut(
                    attendanceLog[i],
                    req
                  );
                //Multiple Day Multiple Machine Multiple In Out
                else
                  console.log(
                    'algorithm not found',
                    attendanceLog[i].attendanceLogID
                  );

                break;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

exports.heeraGroupBiometric = async (req, res, next) => {
  const id = 364,
    createBy = 74671,
    createByIp = '113.193.179.19';
  try {
    const execution_status = await ExecutionStatus.findOne({
      where: { companyMasterID: id },
      raw: true,
    });

    if (execution_status)
      return res.status(200).json({
        status: 401,
        message: 'Someone is Syncing or Validating the Logs...!!',
      });

    await ExecutionStatus.create({
      userMasterID: createBy,
      companyMasterID: id,
      status: 1,
      createBy: createBy,
      createByIp: createByIp,
    });

    const serverIPPort = '103.39.236.83:9494',
      userName = 'admin',
      userPassword = 'admin',
      IsTransfer = 'false';

    //To get the token
    const token = await axios.post('http://' + serverIPPort + '/gettoken', {
      Username: userName,
      UserPassword: userPassword,
    });
    console.log(token, '---');
    //If token not found
    if (!token || !token.data || !token.data.token) {
      await ExecutionStatus.destroy({ where: { companyMasterID: id } });

      return res.status(200).json({
        status: 401,
        message: 'Token not found!',
      });
    }

    //To get the attendance Data
    const attendanceData = await axios.post(
      'http://' + serverIPPort + '/GetBMAttendanceList',
      {
        IsTransfer: IsTransfer,
      },
      {
        headers: {
          Authorization: `Bearer ${token.data.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    //If Attendance Data not found
    if (
      !attendanceData ||
      !attendanceData.data ||
      !attendanceData.data.AttendanceData
    ) {
      await ExecutionStatus.destroy({ where: { companyMasterID: id } });

      return res.status(200).json({
        status: 401,
        message: 'Attendance not found!',
      });
    }

    const chunkSize = 100;

    for (
      let i = 0;
      i < attendanceData.data.AttendanceData.length;
      i += chunkSize
    ) {
      const chunk = attendanceData.data.AttendanceData.slice(i, i + chunkSize);
      // console.log(chunk.RecordNumber,'chunk');
      const allIDs = await heerabiometricSync(id, chunk);
      console.log(
        allIDs,
        'allids',
        i,
        attendanceData.data.AttendanceData.length
      );

      // //To get the token for update
      const tokenForUpdate = await axios.post(
        'http://' + serverIPPort + '/gettoken',
        {
          Username: userName,
          UserPassword: userPassword,
        }
      );

      //If token not found
      if (
        !tokenForUpdate ||
        !tokenForUpdate.data ||
        !tokenForUpdate.data.token
      ) {
        await ExecutionStatus.destroy({ where: { companyMasterID: id } });

        return res.status(200).json({
          status: 401,
          message: 'Token not found!',
        });
      }

      //To update attendance Data
      const updateLogs = await axios.post(
        'http://' + serverIPPort + '/UpdateBMAttendance',
        {
          RecordId: allIDs,
          Status: 'T',
        },
        {
          headers: {
            Authorization: `Bearer ${tokenForUpdate.data.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(updateLogs.data);
    }
    await heerabiometricValidate(id, createBy, createByIp);
    await ExecutionStatus.destroy({ where: { companyMasterID: id } });

    return res.status(200).json({
      status: 200,
      message: 'Biometric sync & Validated Successfully',
      ids: [],
    });
  } catch (err) {
    await ExecutionStatus.destroy({ where: { companyMasterID: id } });
    next(err);
  }
};

exports.addManualLog = async (req, res, next) => {
  try {
    const { userMasterID, dateTime, date, createBy, createByIp } = req.body;

    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const minTime = new Date(date + 'T00:00:00');
    const maxTime = new Date(
      endDate.toISOString().substring(0, 10) + 'T23:59:59'
    );

    if (new Date(dateTime) < minTime || new Date(dateTime) > maxTime)
      return res
        .status(200)
        .json({ status: 401, message: 'Please enter a valid Log Datetime' });

    const Log = await AttendanceLogs.create({
      userMasterID: userMasterID,
      AttendanceTransID: attendaceTransType.biometricNotValidated,
      logDateTime: dateTime,
      direction: '',
      photo: '',
      attendnaceFrom: 'manual',
      longitude: '',
      latitude: '',
      address: '',
      createBy: createBy,
      createByIp: createByIp,
    });

    const attendance = await attendanceTransaction.findOne({
      raw: true,
      where: { userMasterID: userMasterID, AttendanceDate: date },
    });

    if (!attendance) {
      await createNewIn(Log, date, req);
    } else {
      await updateLogtoNC(Log.attendanceLogID);
      const userAttendacePolicy = await employeeAttendancePolicy(
        userMasterID,
        date
      );
      let policyType = 'Multiple';
      if (userAttendacePolicy)
        policyType = userAttendacePolicy.singleMultiplePunchInPunchOut;

      const allLogs = await AttendanceLogs.findAll({
        raw: true,
        where: { AttendanceTransID: attendance.AttendanceTransID },
        order: [['logDateTime', 'ASC']],
      });

      const insertIndex = allLogs.findIndex(
        (item) => new Date(item.logDateTime) > new Date(Log.logDateTime)
      );

      if (insertIndex === -1) {
        // If the insertIndex is -1, it means the log should be inserted at the end.
        allLogs.push(Log);
      } else {
        // Insert the log at the correct chronological position.
        allLogs.splice(insertIndex, 0, Log);
      }
      await destroyAttendance(userMasterID, date);

      if (policyType == 'Single') {
        if (allLogs.length > 0) await createNewIn(allLogs[0], date, req);

        if (allLogs.length > 1)
          await createOut(allLogs[allLogs.length - 1], date, req);
      } else {
        var direction = 'in';
        for (var currlog of allLogs) {
          console.log(currlog.attendanceLogID, 'allLogs');

          if (direction == 'in')
            await createNewIn(currlog, date, req), (direction = 'out');
          else if (direction == 'out')
            await createOut(currlog, date, req, true),
              (direction = 'continuein');
          else await createContinueIn(currlog, date, req), (direction = 'out');
        }
      }
    }

    return res
      .status(200)
      .json({ status: 200, message: 'Log Added Successfully' });
  } catch (error) {
    next(error);
  }
};

function formatDates(dateStr) {
  // Convert the input string to a Date object
  var dateObj = new Date(dateStr);

  // Get the first date of the month
  var firstDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);

  // Format dates in the desired format
  var firstDateFormatted = formatDate(firstDate);
  var passedDateFormatted = formatDate(dateObj);

  return [firstDateFormatted, passedDateFormatted];
}

function formatDate(date) {
  var months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  var day = date.getDate();
  var month = months[date.getMonth()];
  var year = date.getFullYear();
  return (day < 10 ? '0' : '') + day + '-' + month + '-' + year;
}

const Employeeincentive = require('../models/employeeincentive');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const CompensatoryOffAuthorization = require('../models/compensatoryOffAuthorization');
const UserInbox = require('../models/UserInbox');
const path = require('path');
const BranchMaster = require('../models/branchMaster');
const Designation = require('../models/designation');
const Department = require('../models/department');
const companyMaster = require('../models/companyMaster');
const {
  DateTimeType,
  attendaceTransType,
  attendanceTransactionType,
  attendanceDirection,
} = require('../utils/dbUtils');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const ShiftRoster = require('../models/shiftRoster');

exports.asopalavCommissionAPI = async (req, res, next) => {
  try {
    //Static Body for the API with Custom Dates
    const AllBranchCodes = [
      '0010', //Satellite
      '0011', //ASHRAMROAD
      '0016', //RATANPOLE
      '0017', //Vadaj
      '0019', //Surat
    ];
    const body = [
      {
        ACTION: 'ASP_SR_COMMISSION',
        CHANNEL: 'I',
        MODULE_CD: '0',
        ACTIVITY_CD: '0',
        REQUEST_DATA: [
          {
            COMP_CD: '0010',
            BRANCH_CD: '',
            SR_CODE: 'ALL',
            FROM_DT: '',
            TO_DT: '',
          },
        ],
      },
    ];

    // To get the Dates
    var date = asiaKolkataDateTime(new Date()).slice(0, 10);
    const prevDate = new Date(
      new Date(date).setDate(new Date(date).getDate() - 1)
    )
      .toISOString()
      .slice(0, 10);

    if (+new Date().getDate() == 1) {
      date = new Date(new Date().setDate(new Date().getDate() - 1));
      date = new Date(date).toISOString().slice(0, 10);
    }

    var formattedDates = formatDates(date);
    body[0].REQUEST_DATA[0].FROM_DT = formattedDates[0];
    body[0].REQUEST_DATA[0].TO_DT = formattedDates[1];

    //API URL
    const APIURL = process.env.FAS_API_URL;

    for (var code of AllBranchCodes) {
      body[0].REQUEST_DATA[0].BRANCH_CD = code;
      // console.log(body[0].REQUEST_DATA[0], 'body', code);
      //To get the commission Data
      const allCMs = await axios.post(APIURL, body);

      if (
        allCMs.data &&
        allCMs.data.length != 0 &&
        allCMs.data[0].RESPONSE_DATA &&
        allCMs.data[0].RESPONSE_DATA.length != 0
      ) {
        // console.log(allCMs.data[0].RESPONSE_DATA[0], '--');
        const YYYYMM = date.slice(0, 4) + date.slice(5, 7);

        // console.log(
        //   YYYYMM,
        //   'YYYYMM',
        //   allCMs.data[0].RESPONSE_DATA[0],
        //   '11'
        // );

        for (var item of allCMs.data[0].RESPONSE_DATA) {
          const findEmp = await SN_Code.findAll({
            where: {
              status: 1,
              [Sequelize.Op.and]: [
                { sn_code: item.SR_CODE.toString().trim() },
                { sn_code: { [Sequelize.Op.notIn]: ['V100'] } },
              ],
            },
            include: [
              {
                model: UserMaster,
                attributes: ['companyMasterId'],
                where: { companyMasterId: 277 },
              },
            ],
          });

          if (findEmp.length == 1) {
            // console.log(findEmp[0].userMasterID, 'USER');
            if (item.HS_PERC1) {
              const findIncentive = await Employeeincentive.findOne({
                where: {
                  userMasterID: findEmp[0].userMasterID,
                  IncentivetypeID: 191,
                  yearmonth: +YYYYMM,
                  status: 1,
                },
                raw: true,
              });
              let description = 'Amount: ' + item.HS_AMOUNT;
              if (findIncentive) {
                await Employeeincentive.update(
                  {
                    amount: +item.HS_PERC1,
                    description: description,
                    incentiveDate: prevDate,
                  },
                  {
                    where: {
                      employeeincentiveID: findIncentive.employeeincentiveID,
                    },
                  }
                );
              } else {
                await Employeeincentive.create({
                  userMasterID: findEmp[0].userMasterID,
                  amount: +item.HS_PERC1,
                  yearmonth: +YYYYMM,
                  description: description,
                  IncentivetypeID: 191,
                  createBy: findEmp[0].userMasterID,
                  incentiveDate: prevDate,
                });
              }
            }

            if (item.GL_PERC1) {
              const findIncentive = await Employeeincentive.findOne({
                where: {
                  userMasterID: findEmp[0].userMasterID,
                  IncentivetypeID: 192,
                  yearmonth: +YYYYMM,
                  status: 1,
                },
                raw: true,
              });
              let description =
                'Quantity: ' + item.QTY + ', Amount: ' + item.GL_AMOUNT;

              if (findIncentive) {
                await Employeeincentive.update(
                  {
                    amount: +item.GL_PERC1,
                    description: description,
                    incentiveDate: prevDate,
                  },
                  {
                    where: {
                      employeeincentiveID: findIncentive.employeeincentiveID,
                    },
                  }
                );
              } else {
                await Employeeincentive.create({
                  userMasterID: findEmp[0].userMasterID,
                  amount: +item.GL_PERC1,
                  yearmonth: +YYYYMM,
                  description: description,
                  IncentivetypeID: 192,
                  createBy: findEmp[0].userMasterID,
                  incentiveDate: prevDate,
                });
              }
            }
          }
        }
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'commission Synced successfully',
      // body: body,
      // data: allCMs.data[0],
    });
  } catch (err) {
    next(err);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { limit, page, companyMasterID, dateTimeType } = await req.body;
    const condition = {};
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    condition.companyMasterId = companyMasterID;
    condition.status = 1;
    const order = [['displayName', 'ASC']];
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const userData = await UserMaster.findAndCountAll({
      // raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: EmployeeJoiningDetails,
          required: true,
          attributes: [
            'employeeJoiningDetailId',
            'employeeCode',
            'biometricCode',
            'biometricSerialNo',
          ],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(currentdate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(currentdate),
                },
              },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['branchID'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
              attributes: ['branchName'],
            },
          ],
        },
        {
          required: false,
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          attributes: ['designationID'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationName'],
            },
          ],
        },
        {
          required: false,
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          attributes: ['departmentID'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentName'],
            },
          ],
        },
        {
          model: companyMaster,
          required: true,
          attributes: ['companyMasterID', 'companyName', 'fileUploadType'],
        },
      ],
      attributes: [
        'userMasterID',
        'displayName',
        'companyMasterId',
        'userNumber',
      ],
    });
    const userDataNames = userData.rows.map((row) => {
      const mergeCellData =
        row.displayName +
        ' (' +
        row.userNumber +
        ')' +
        (row.employeeJoiningDetails &&
        row.employeeJoiningDetails.length > 0 &&
        row.employeeJoiningDetails[0].employeeCode != null
          ? ' (' + row.employeeJoiningDetails[0].employeeCode + ')'
          : '');

      return {
        userMasterID: row.userMasterID,
        displayName: row.displayName,
        userNumber: row.userNumber,
        companyMasterId: row.companyMasterId,
        employeeCode:
          row.employeeJoiningDetails && row.employeeJoiningDetails.length > 0
            ? row.employeeJoiningDetails[0].employeeCode
            : '',
        biometricCode:
          row.employeeJoiningDetails && row.employeeJoiningDetails.length > 0
            ? row.employeeJoiningDetails[0].biometricCode
            : '',
        biometricSerialNo:
          row.employeeJoiningDetails && row.employeeJoiningDetails.length > 0
            ? row.employeeJoiningDetails[0].biometricSerialNo
            : '',
        branch:
          (row.employeeBranches && row.employeeBranches.length) > 0
            ? row.employeeBranches[0].branchMaster
              ? row.employeeBranches[0].branchMaster.branchName
              : ''
            : '',
        designation:
          (row.employeeDesignations && row.employeeDesignations.length) > 0
            ? row.employeeDesignations[0].designation
              ? row.employeeDesignations[0].designation.designationName
              : ''
            : '',
        department:
          (row.employeeDepartments && row.employeeDepartments.length) > 0
            ? row.employeeDepartments[0].department
              ? row.employeeDepartments[0].department.departmentName
              : ''
            : '',
        company: row.companyMaster.companyName,
        mergedData: mergeCellData,
      };
    });

    await genrateDemoExcelForBiometricAttendance(
      userDataNames,
      'Upload Biometric Attendance',
      'xlsx',
      dateTimeType,
      res
    );
  } catch (err) {
    next(err);
  }
};

function isValidDateTime(date, time) {
  // Check if date and time are valid Date objects
  if (
    date instanceof Date &&
    !isNaN(date) &&
    time instanceof Date &&
    !isNaN(time)
  ) {
    // Combine the date and time into a single DateTime using UTC
    const mergedDateTime = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        time.getUTCHours(),
        time.getUTCMinutes(),
        time.getUTCSeconds()
      )
    );

    // Return the merged DateTime if valid, else false
    return !isNaN(mergedDateTime) ? mergedDateTime : false;
  }
  // Return false if either date or time is invalid
  return false;
}

function isValidDateTime2(datetime) {
  // Check if date and time are valid Date objects
  if (datetime instanceof Date && !isNaN(datetime)) {
    // Combine the date and time into a single DateTime using UTC
    const mergedDateTime = new Date(
      Date.UTC(
        datetime.getUTCFullYear(),
        datetime.getUTCMonth(),
        datetime.getUTCDate(),
        datetime.getUTCHours(),
        datetime.getUTCMinutes(),
        datetime.getUTCSeconds()
      )
    );

    // Return the merged DateTime if valid, else false
    return !isNaN(mergedDateTime) ? mergedDateTime : false;
  }
  // Return false if either date or time is invalid
  return false;
}

exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }
  const { companyMasterID, dateTimeType } = req.body;
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();

    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const users = await UserMaster.findAll({
      raw: true,
      where: { companyMasterId: companyMasterID, status: 1 },
      include: [
        {
          model: EmployeeJoiningDetails,
          where: {
            [Sequelize.Op.and]: [
              { biometricSerialNo: { [Sequelize.Op.ne]: null } },
              { biometricSerialNo: { [Sequelize.Op.ne]: '' } },
              { biometricCode: { [Sequelize.Op.ne]: null } },
              { biometricCode: { [Sequelize.Op.ne]: '' } },
            ],
          },
          required: true,
          attributes: [
            'employeeJoiningDetailId',
            'employeeCode',
            'biometricCode',
            'biometricSerialNo',
          ],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(currentdate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(currentdate),
                },
              },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['branchID'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
              attributes: ['branchName'],
            },
          ],
        },
        {
          required: false,
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          attributes: ['designationID'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationName'],
            },
          ],
        },
        {
          required: false,
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          attributes: ['departmentID'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentName'],
            },
          ],
        },
        {
          model: companyMaster,
          required: true,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
    });

    const biometricData = [];
    let pendinguserData = [];
    const uniqueValues = new Set();

    for (const row of rows) {
      if (!row[0]) continue;

      const biometricCode = row[0].toString().trim();

      const userMaster = users.find(
        (item) => item['employeeJoiningDetails.biometricCode'] === biometricCode
      );

      if (!userMaster) {
        if (!uniqueValues.has(row[0])) {
          pendinguserData.push(row[0]);
          uniqueValues.add(row[0]); // Use 'add' instead of 'push'
        }
        continue;
      }

      let logData = {
        userMasterID: userMaster.userMasterID,
        companyMasterID: companyMasterID,
        displayName: userMaster.displayName,
        employeeCode: userMaster['employeeJoiningDetails.employeeCode'],
        branch: userMaster['employeeBranches.branchMaster.branchName'],
        designation:
          userMaster['employeeDesignations.designation.designationName'],
        department: userMaster['employeeDepartments.department.departmentName'],
        company: userMaster['companyMaster.companyName'],
        biometricCode: userMaster['employeeJoiningDetails.biometricCode'],
        biometricSerialNo:
          userMaster['employeeJoiningDetails.biometricSerialNo'].split(',')[0],
        userNumber: userMaster.userNumber,
        direction: row[3],
        remarks: [],
        logDateTime: null,
      };

      if (dateTimeType == DateTimeType.SEPERATED) {
        if (!row[4]) logData.remarks.push('Please Enter Valid Log Date');
        if (!row[5]) logData.remarks.push('Please Enter Valid Log Time');

        if (!logData.remarks.length) {
          const logDateTime = isValidDateTime(row[4], row[5]);
          if (logDateTime) logData.logDateTime = logDateTime;
          else logData.remarks.push('Please Enter Valid Log DateTime');
        }
      } else {
        if (!row[4]) logData.remarks.push('Please Enter Valid Log Date Time');

        if (!logData.remarks.length) {
          const logDateTime = isValidDateTime2(row[4]);
          if (logDateTime) logData.logDateTime = logDateTime;
          else logData.remarks.push('Please Enter Valid Log DateTime');
        }
      }

      logData.remarks = logData.remarks.join(',');
      biometricData.push(logData);
    }

    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });

    if (pendinguserData.length)
      pendinguserData = `User with biometric code ${pendinguserData.join(' ')} cannot be uploaded`;
    else pendinguserData = '';

    return res.status(200).json({
      status: 200,
      message: 'Biometric Logs Validate successfully.',
      data: biometricData,
      pendinguserData,
    });
  } catch (error) {
    next(error);
  }
};
