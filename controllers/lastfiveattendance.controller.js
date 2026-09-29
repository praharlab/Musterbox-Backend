const Sequelize = require('sequelize');
const attendanceTransaction = require('../models/attendanceTransaction');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');

exports.attendanceData1 = async (req, res, next) => {
  try {
    let attendancetransaction = await attendanceTransaction.findAll({
      where: {
        userMasterID: req.body.userMasterID,
        AttendanceDate: req.body.AttendanceDate,
      },
    });

    return res.json({
      status: 200,
      message: message.usermessage.attendancedata,
      data: attendancetransaction,
    });
  } catch (err) {
    next(err);
  }
};

exports.attendanceData = async (req, res, next) => {
  try {
    let attendancetransaction = await attendanceTransaction.findAll({
      where: {
        userMasterID: req.body.userMasterID,
      },
      order: [['InDatetime', 'DESC']],
    });

    let result = [];

    if (attendancetransaction.length > 6) {
      for (var i = 0; i < 6; i++) {
        result.push(attendancetransaction[i]);
      }
    } else {
      result = attendancetransaction;
    }

    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;

    if (result.length > 0) {
      if (result[0].AttendanceDate == today) {
        result.splice(0, 1);
      } else {
        result.splice(5, 1);
      }
    }

    return res.json({
      status: 200,
      message: message.usermessage.attendancedata,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
