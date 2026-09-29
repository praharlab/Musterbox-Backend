const UserLogs = require('../models/userLogs');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const companyMasters = require('../models/companyMaster');
const config = require('../config/erpdatabase');
const logsManagement = require('../middleware/logsManagement');
const sql = require('mssql');

exports.postAddUserLogs = async (req, res, next) => {
  const data = {
    userMasterID: 1486,
    companyMasterID: 3,
    functionalityUse: 'visit',
    createBy: 1486,
    createByIp: '',
  };

  logsManagement.addUserLogs(data);
};
