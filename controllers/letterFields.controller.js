const letterFields = require('../models/letterFields');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const LetterTemplateType = require('../models/letterTemplateType');

exports.postAddLetterFields = async (req, res, next) => {
  try {
    let = { letterFieldsname, letterTypeID, status, createByIp } =
      await req.body;
    let insert_db_status = await letterFields.create({
      letterFieldsname,
      letterTypeID,
      status,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Letter Fields'),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all city data
 */

exports.getAllLetterFields = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }
    const condition = {
      status: {
        [Sequelize.Op.in]: [0, 1],
      },
    };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { letterFieldsname: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await letterFields.findAndCountAll({
      where: condition,
      order: [['letterFieldsname', 'ASC']],
      ...paginationQuery,
      include: [{ all: true }],
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

exports.getLetterFieldsId = async (req, res, next) => {
  try {
    let get_one_data = await letterFields.findOne({
      where: { letterFieldsID: req.params.id },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
exports.postDeleteLetterFieldsById = async (req, res, next) => {
  try {
    let = { letterFieldsID } = await req.body;
    await letterFields.update(
      {
        status: '2',
      },
      {
        where: { letterFieldsID },
      }
    );
    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.deleteMessage('Letter Fields'),
      });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { letterFieldsID, status } = await req.body;
    await letterFields.update(
      {
        status,
      },
      {
        where: { letterFieldsID },
      }
    );
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Letter Fields')
          : message.usermessage.deactiveMessage('Letter Fields'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.getLetterFieldsByLetterType = async (req, res, next) => {
  try {
    let { limit, page, letterTypeID } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      letterTypeID,
      status: ['0', '1'],
    };

    // Fetch data with pagination and condition
    const { rows, count } = await letterFields.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.getActiveLetterTypeData = async (req, res, next) => {
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

    const { rows, count } = await letterFields.findAndCountAll({
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
