const Sequelize = require('sequelize');
const MailFields = require('../models/mailFields');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const MailTemplateType = require('../models/mailTemplateType');
const mailTemplateType = require('../models/mailTemplateType');

exports.postAddMailFields = async (req, res, next) => {
  try {
    let = { mailfields_name, mailTypeID, status, createByIp } = await req.body;
    let insert_db_status = await MailFields.create({
      mailfields_name,
      mailTypeID,
      status,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Mail Fields'),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllMailFieldsData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows, count } = await MailFields.findAndCountAll({
      raw: true,
      where: {
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      ...paginationQuery,
      include: [{ model: mailTemplateType }],
      order: [['mailfieldsid', 'ASC']],
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

exports.getMailFieldsByMailType = async (req, res, next) => {
  try {
    let { limit, page, mailtypeid } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }
    const condition = {
      mailTypeID: mailtypeid,
      status: ['0', '1'],
    };
    const order = [['mailfields_name', 'ASC']];
    const { rows, count } = await MailFields.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      raw: true,
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteMailFieldsById = async (req, res, next) => {
  try {
    let { mailfieldsid } = await req.body;

    await MailFields.update(
      {
        status: '2',
      },
      {
        where: { mailfieldsid },
      }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.deleteMessage('Mail Fields'),
      });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { mailfieldsid, status } = await req.body;

    await MailFields.update(
      {
        status,
      },
      {
        where: { mailfieldsid },
      }
    );
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Mail Fields')
          : message.usermessage.deactiveMessage(' Mail Fields'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.getActiveMailTypeData = async (req, res, next) => {
  try {
    const { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: 1,
    };
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { letterTypename: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await MailFields.findAndCountAll({
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
