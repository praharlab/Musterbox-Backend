const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const ResigantionReason = require('../models/resigantionReason');
const message = require('../response_message/message');

exports.postAddResignationReason = async (req, res, next) => {
  try {
    let { reason } = await req.body;

    const existingResignationReason = await ResigantionReason.findOne({
      where: [
        sequelize.where(
          sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('reason'))),
          reason.trim().toLowerCase()
        ),
      ],
    });

    if (existingResignationReason) {
      return res.status(200).json({
        status: 409,
        message: message.usermessage.alreadyExists('Resigantion Reason'),
      });
    }

    await ResigantionReason.create(
      {
        reason,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Resigantion Reason'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateResigantionReason = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { reason } = await req.body;

    const existingResignationReason = await ResigantionReason.findOne({
      where: [
        sequelize.where(
          sequelize.fn('TRIM', sequelize.fn('LOWER', sequelize.col('reason'))),
          reason.trim().toLowerCase()
        ),
        { resigantionReasonID: { [Sequelize.Op.ne]: id } },
      ],
    });

    if (existingResignationReason) {
      return res.status(200).json({
        status: 409,
        message: message.usermessage.alreadyExists('Resigantion Reason'),
      });
    }

    await sequelize.transaction(async (t) => {
      await ResigantionReason.update(
        {
          reason,
          updateBy: req.userDetails.userMasterId,
          updateByIp: req.userDetails.userIpAddress,
        },
        {
          where: { resigantionReasonID: id },
          transaction: t,
        }
      );
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Resigantion Reason'),
    });
  } catch (error) {
    next(error);
  }
};

exports.getResigantionReasonById = async (req, res, next) => {
  try {
    let getResigantionReason = await ResigantionReason.findOne({
      where: {
        resigantionReasonID: req.params.id,
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: getResigantionReason });
  } catch (err) {
    next(err);
  }
};

exports.getAllResigantionReason = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {};

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { reason: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await ResigantionReason.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteResignationReason = async (req, res, next) => {
  try {
    const { resigantionReasonID } = await req.body;

    await ResigantionReason.destroy(
      { where: { resigantionReasonID } },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Resignation Reason'),
    });
  } catch (err) {
    next(err);
  }
};
