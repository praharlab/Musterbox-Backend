const Sequelize = require('sequelize');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');

exports.getAddweekoffTran = async (req, res, next) => {
  try {
    let yearMonth = req.params.yearMonth;

    let results;
    results = await sequelize.query(
      `select EmpW."userMasterID",WP."companyMasterID",WO."day",WO."options" from public."weekOffPolicies" as WP inner join public."weekOffOptions" as WO
            on WP."weekOffPolicyID"=WO."weekOffPolicyID" Left Outer Join public."employeeWeekOffs" as EmpW
            on WP."weekOffPolicyID"=EmpW."weekOffPolicyID"`,
      { type: Sequelize.SELECT }
    );

    function Value(option) {
      if (option.slice(0, 4) == 'full') {
        return 1;
      } else {
        return 0.5;
      }
    }

    function getDate(year, month, day) {
      var start_date = new Date(year, month - 1, 2);
      var end_date = new Date(year, month, 0).getDate();
      var day_date = new Array();
      var day_val;
      if (day == 'sunday') {
        day_val = 0;
      } else if (day == 'monday') {
        day_val = 1;
      } else if (day == 'tuesday') {
        day_val = 2;
      } else if (day == 'wednesday') {
        day_val = 3;
      } else if (day == 'thursday') {
        day_val = 4;
      } else if (day == 'friday') {
        day_val = 5;
      } else {
        day_val = 6;
      }

      for (var i = 1; i <= end_date; i++) {
        var newDate = new Date(
          start_date.getFullYear(),
          start_date.getMonth(),
          i
        );
        if (newDate.getDay() == day_val) {
          day_date.push(i);
        }
      }
      return day_date;
    }

    var arr = [];
    for (var i = 0; results[0][i] != undefined; i++) {
      if (results[0][i].userMasterID != null) {
        for (j = 0; j < results[0][i].options.length; j++) {
          var value = Value(results[0][i].options[j].option);
          var temp_date;
          var day = results[0][i].day;
          var year = String(yearMonth).slice(0, 4);
          var month = String(yearMonth).slice(4, 6);
          var day_option = results[0][i].options[j].name.slice(0, 3);

          if (day_option != 'all') {
            if (day_option == '1st') {
              temp_date = getDate(year, month, day)[0];
            } else if (day_option == '2nd') {
              temp_date = getDate(year, month, day)[1];
            } else if (day_option == '3rd') {
              temp_date = getDate(year, month, day)[2];
            } else if (day_option == '4st') {
              temp_date = getDate(year, month, day)[3];
            } else if (getDate(String(yearMonth, day))[4] != null) {
              temp_date = getDate(year, month, day)[4];
            } else {
              temp_date = null;
            }
            if (temp_date != null) {
              let temp = {
                companyMasterID: results[0][i].companyMasterID,
                userMasterID: results[0][i].userMasterID,
                yearMonth: yearMonth,
                date: new Date(year, month - 1, temp_date),
                dayName: results[0][i].day,
                value: value,
                tableName: 'weekoff',
              };
              arr.push(temp);
            }
          } else {
            for (k = 0; getDate(year, month, day)[k] != null; k++) {
              temp_date = getDate(year, month, day)[k];
              let temp = {
                companyMasterID: results[0][i].companyMasterID,
                userMasterID: results[0][i].userMasterID,
                yearMonth: yearMonth,
                date: new Date(year, month - 1, temp_date),
                dayName: results[0][i].day,
                value: value,
                tableName: 'weekoff',
              };
              arr.push(temp);
            }
          }
        }
      }
    }
    await sequelize.transaction(async (t) => {
      let insert_db_status = await weekoffHolidayTran.bulkCreate(arr, {
        transaction: t,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.weekoffHolidayTranAdd,
      });
      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getAddHolidayTran = async (req, res, next) => {
  try {
    let yearMonth = req.params.yearMonth;
    let results;
    results = await sequelize.query(
      `select um."companyMasterID",un."userMasterID", hl."holidayDate",hl."holidayListName" from public."holidayPolicies" as um
            inner join public."employeeHolidayPolicies" as un on um."holidayPolicyID"=un."holidayPolicyID"
            inner join public."holidayLists" as hl on un."holidayPolicyID"=hl."holidayPolicyID"`,
      { type: Sequelize.SELECT }
    );
    function get_day(date) {
      temp = date.getDay();
      days = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      return days[temp];
    }
    var arr = [];
    for (var i = 0; results[0][i] != undefined; i++) {
      if (results[0][i].userMasterID != null) {
        for (var j = 0; results[0][i].holidayDate[j] != null; j++) {
          let temp = {
            companyMasterID: results[0][i].companyMasterID,
            userMasterID: results[0][i].userMasterID,
            yearMonth: yearMonth,
            date: results[0][i].holidayDate[j],
            dayName: get_day(results[0][i].holidayDate[j]),
            value: 1,
            tableName: 'holiday',
          };
          var month = temp.date.getUTCMonth() + 1;
          var year = temp.date.getUTCFullYear();
          var temp_yearMonth = year + String(month).padStart(2, '0');

          if (String(temp_yearMonth) == temp.yearMonth) {
            arr.push(temp);
          }
        }
      }
    }
    await sequelize.transaction(async (t) => {
      let insert_db_status = await weekoffHolidayTran.bulkCreate(arr, {
        transaction: t,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.weekoffHolidayTranAdd,
      });
      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
