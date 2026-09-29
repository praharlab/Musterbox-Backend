const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyNotificationSetup = require('../models/companyNotificationSetup');
const { statusCodes } = require('../utils/commonVars');
const { usermessage } = require('../response_message/message');
const companyMaster = require('../models/companyMaster');

exports.addData = async (req, res, next) => {
  try {
    const { companyMasterID, notificationType, time, timeType, timeFormat } =
      req.body;

    if (time < 1)
      return res.status(statusCodes.OK).json({
        status: 401,
        message: 'Time must be greater than 0!',
      });

    const findNotificationSetup = await CompanyNotificationSetup.findOne({
      where: {
        companyMasterId: companyMasterID,
        notificationType,
      },
    });

    if (findNotificationSetup)
      return res.status(statusCodes.OK).json({
        status: 401,
        data: findNotificationSetup,
        message: 'Notification Setup Already Exist!',
      });

    const notificationSetup = await CompanyNotificationSetup.create(
      {
        companyMasterId: companyMasterID,
        notificationType,
        time,
        timeType: notificationType == 'holiday' ? 'before' : timeType,
        timeFormat,
      },
      { user: req.userDetails }
    );
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      data: notificationSetup,
      message: usermessage.addMessage('Notification Setup'),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateData = async (req, res, next) => {
  try {
    const { id } = await req.params;
    const { time, timeType, timeFormat } = req.body;

    if (time < 1)
      return res.status(statusCodes.OK).json({
        status: 401,
        message: 'Time must be greater than 0!',
      });

    const findNotificationPolicy = await CompanyNotificationSetup.findByPk(id);

    if (!findNotificationPolicy)
      return res.status(200).json({
        status: 401,
        message: usermessage.notFoundMessage('Notification Setup'),
      });

    if (time) findNotificationPolicy.time = time;
    if (timeType)
      findNotificationPolicy.timeType =
        findNotificationPolicy.notificationType == 'holiday'
          ? 'before'
          : timeType;
    if (timeFormat) findNotificationPolicy.timeFormat = timeFormat;

    await findNotificationPolicy.save({
      user: req.userDetails,
    });

    return res.status(statusCodes.OK).json({
      status: 200,
      message: usermessage.updateMessage('Notification Setup'),
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = await req.params;
    const findNotificationPolicy = await CompanyNotificationSetup.findByPk(id, {
      raw: true,
      include: [{ model: companyMaster, attributes: ['companyName'] }],
    });
    if (!findNotificationPolicy)
      return res.status(200).json({
        status: 401,
        message: usermessage.notFoundMessage('Notification Setup'),
      });

    return res.status(statusCodes.OK).json({
      status: 200,
      data: findNotificationPolicy,
    });
  } catch (error) {
    next(error);
  }
};

exports.getlist = async (req, res, next) => {
  try {
    const { companyMasterID, notificationType, page, limit, search } =
      req.query;

    const condition = {};

    if (companyMasterID) condition.companyMasterId = companyMasterID;

    if (notificationType) condition.notificationType = notificationType;

    if (search) {
      condition[Sequelize.Op.or] = [
        Sequelize.literal(`"notificationType"::text ILIKE '%${search}%'`),
        Sequelize.literal(`"companyMaster"."companyName" ILIKE '%${search}%'`),
      ];
    }

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const notificationSetupData =
      await CompanyNotificationSetup.findAndCountAll({
        raw: true,
        where: condition,
        ...paginateCondition,
        include: [{ model: companyMaster, attributes: ['companyName'] }],
        order: [['createdAt', 'DESC']],
      });

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      data: notificationSetupData.rows,
      totalcount: notificationSetupData.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteById = async (req, res, next) => {
  try {
    const { id } = await req.params;

    const findNotificationPolicy = await CompanyNotificationSetup.findByPk(id);

    if (!findNotificationPolicy)
      return res.status(200).json({
        status: 401,
        message: usermessage.notFoundMessage('Notification Setup'),
      });

    await findNotificationPolicy.destroy({
      user: req.userDetails,
    });

    return res.status(statusCodes.OK).json({
      status: 200,
      message: usermessage.deleteMessage('Notification Setup'),
    });
  } catch (error) {
    next(error);
  }
};
