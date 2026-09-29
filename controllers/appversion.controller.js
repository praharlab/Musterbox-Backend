const Sequelize = require('sequelize');
const AppVersion = require('../models/appVersion');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');

/**
 return all appVersion data
 */

exports.getAllAppVersionData = async (req, res, next) => {
  try {
    let appVersion = await AppVersion.findAll({
      raw: true,
      order: [['deviceType', 'ASC']],
    });

    return res.status(200).json({ status: 200, data: appVersion });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with appVersion id
 *
 * @param {id} appVersionID  to fetch appVersion name
 */

exports.getAppVersionById = async (req, res, next) => {
  try {
    let get_one_data = await AppVersion.findOne({
      where: {
        appVersionID: req.params.id,
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} appVersionID  to update id
 */
exports.postUpdateAppVersion = async (req, res, next) => {
  try {
    const { appVersionID, deviceType, appVersion, updateByIp } = await req.body;

    await AppVersion.update(
      {
        deviceType,
        appVersion,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { appVersionID },
      }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.updateMessage('Version'),
      });
  } catch (err) {
    next(err);
  }
};
