const AuditLogs = require('../models/auditLogs');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const { generateExcel } = require('../utils/exportData');
const { executeQuery } = require('./common.controller');
const UserMaster = require('../models/userMaster');
const moment = require('moment');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      companyMasterID,
      tableName,
      exportData,
      operation,
      startdate,
      enddate,
    } = await req.body;

    const condition = {};
    condition.companyMasterID = companyMasterID;
    if (tableName) condition.tableName = tableName;
    if (operation) condition.operation = operation;
    if (startdate && enddate) {
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }
    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }
    let get_data = await AuditLogs.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: [['createdAt', 'DESC']],
    });

    for (var i = 0; i < get_data.rows.length; i++) {
      let user1 = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: get_data.rows[i].createBy,
        },
      });

      if (user1) {
        get_data.rows[i].createByUser = user1.displayName;
      }
    }

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < get_data.rows.length; i++) {
        const data1 = {
          TableName: get_data.rows[i].tableName.toUpperCase(),
          Operation: get_data.rows[i].operation,
          Date: get_data.rows[i].createdAt
            ? moment(get_data.rows[i].createdAt).format('DD-MM-YYYY')
            : 'dd-MM-yyyy',
          Time: get_data.rows[i].createdAt
            ? moment(get_data.rows[i].createdAt).format('HH:mm:ss')
            : 'hh:mm:ss',
          createByUser: get_data.rows[i].createByUser,
        };
        finalData.push(data1);
      }

      await generateExcel(finalData, 'auditlogs', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: get_data.rows, totalcount: get_data.count });
  } catch (err) {
    next(err);
  }
};

exports.getUniqueTableNames = async (req, res, next) => {
  try {
    const uniqueTables = await AuditLogs.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('tableName')), 'tableName'],
      ],
    });
    return res.status(200).json({ status: 200, data: uniqueTables });
  } catch (err) {
    next(err);
  }
};
