const logger = require('../config/logger');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const message = require('../response_message/message');

exports.getView = async (req, res, next) => {
  try {
    let { viewName, where } = req.body;

    let result;
    let query = '';
    if (where) query = 'SELECT * FROM ' + viewName + ' WHERE ' + where;
    else query = 'SELECT * FROM ' + viewName;

    result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });
    // if (result.length > 0)
    res.status(200).json({
      status: 200,
      message: message.usermessage.getview,
      data: result,
    });
    // else
    // res.status(200)
    // .json({ status: 200, message: message.usermessage.noview, data: result });
  } catch (err) {
    next(err);
  }
};

const executeQuery = (query) => {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await sequelize.query(query, { nest: true });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};
exports.executeQuery = executeQuery;
exports.getQueryResult = async (req, res, next) => {
  try {
    let { query } = req.body;

    let result = await executeQuery(query);
    res.status(200).json({
      status: 200,
      message: message.usermessage.queryresults,
      data: result[0],
    });
  } catch (err) {
    next(err);
  }
};

exports.returnStoredProcedure = async (req, res, next) => {
  try {
    let result = await sequelize
      .query(
        'SET @outputData = null; CALL stored_procedure (:someInputData, @outputData); SELECT @outputData;',
        {
          replacements: {
            someInputData: 'Send Your Data Here',
          },
          type: sequelize.QueryTypes.RAW,
        }
      )
      .spread((response) => console.log(response, 'response'))
      .error((error) => {
        console.log(error, 'errored');
      });
    console.log(result);
  } catch (err) {
    next(err);
  }
};
