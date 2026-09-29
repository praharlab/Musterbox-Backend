const UserLogs = require('../models/userLogs');
const logger = require('../config/logger');

const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const addUserLogs = async (data) => {
  try {
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await UserLogs.create(
        {
          userMasterID: data.userMasterID,
          companyMasterID: data.companyMasterID,
          functionalityUse: data.functionalityUse,
          createBy: data.createBy,
          createByIp: data.createByIp,
        },
        { transaction: t }
      );

      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    // next(err.message)
    console.log('error', err.message);
  }
};

module.exports = { addUserLogs };
