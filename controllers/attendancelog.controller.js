const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const logger = require('../config/logger');
const message = require('../response_message/message');
const AttendanceLogs = require('../models/attendancelogs');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});
const { Client } = require('@googlemaps/google-maps-services-js');
const UserMaster = require('../models/userMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.postSaveAttendanceLogs = async (req, res, next) => {
  try {
    let = {
      userMasterID,
      logDateTime,
      direction,
      photo,
      attendnaceFrom,
      longitude,
      latitude,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db;
    if (attendnaceFrom == 'mobile') {
      await sequelize.transaction(async (t) => {
        insert_db = await AttendanceLogs.create(
          {
            userMasterID,
            logDateTime: new Date(),
            direction,
            photo,
            attendnaceFrom,
            longitude,
            latitude,
            address: 'SG HIGHWAY',
            createBy,
            createByIp,
          },
          { transaction: t }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.attendancelogsadd,
          data: insert_db,
        });
      });
    } else {
      await sequelize.transaction(async (t) => {
        insert_db = await AttendanceLogs.create(
          {
            userMasterID,
            logDateTime,
            direction,
            photo,
            attendnaceFrom,
            longitude,
            latitude,
            address: 'SG HIGHWAY',
            createBy,
            createByIp,
          },
          { transaction: t }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.attendancelogsadd,
          data: insert_db,
        });
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.postReturnAllAttendanceLogs = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: get_data, count } = await AttendanceLogs.findAndCountAll({
      ...paginationQuery,
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });

    return res.status(200).json({ status: 200, data: get_data, count: count });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateAttendanceLogs = async (req, res, next) => {
  try {
    let = {
      attendanceLogID,
      userMasterID,
      logDateTime,
      direction,
      photo,
      attendnaceFrom,
      longitude,
      latitude,
      address,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_status;
    await sequelize.transaction(async (t) => {
      change_status = await AttendanceLogs.update(
        {
          userMasterID,
          logDateTime,
          direction,
          photo,
          attendnaceFrom,
          longitude,
          latitude,
          address,
          updateBy,
          updateByIp,
        },
        {
          where: { attendanceLogID: attendanceLogID },
          transaction: t,
        }
      );
      return res.status(200).json({
        status: 200,
        message: message.usermessage.attendancelogsupdate,
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteAttendanceLogs = async (req, res, next) => {
  try {
    let = { attendanceLogID } = await req.body;
    let delete_status;
    await sequelize.transaction(async (t) => {
      delete_status = await AttendanceLogs.destroy({
        where: { attendanceLogID: attendanceLogID },
        transaction: t,
      });
      if (!delete_status) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.attendancelogsnotfound,
        });
      }
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.announcementdelete });
    });
  } catch (err) {
    next(err);
  }
};
