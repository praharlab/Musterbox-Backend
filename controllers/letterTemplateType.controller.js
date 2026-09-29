const letterTemplateType = require('../models/letterTemplateType');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const letterField = require('../models/letterFields');
const letterTemplateEditor = require('../models/letterTemplateEditor');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddLetterType = async (req, res, next) => {
  try {
    let = { letterTypename, status, createByIp } = await req.body;

    const existingLetterType = await letterTemplateType.findOne({
      where: {
        letterTypename,
        status: ['0', '1'],
      },
    });

    if (existingLetterType) {
      return res.status(200).json({
        status: 401,
        message: 'Letter Template name already exists.',
      });
    }

    let insert_db_status = await letterTemplateType.create({
      letterTypename,
      status,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Letter Template '),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all city data
 */

exports.getAllLetterType = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: ['1', '0'],
    };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { letterTypename: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await letterTemplateType.findAndCountAll({
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

exports.getLetterTypeId = async (req, res, next) => {
  try {
    let get_one_data = await letterTemplateType.findOne({
      where: { letterTypeID: req.params.id, status: ['0', '1'] },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdatLetterType = async (req, res, next) => {
  try {
    let = { letterTypeID, letterTypename, status, updateByIp } = await req.body;

    const existingLetterType = await letterTemplateType.findOne({
      where: {
        letterTypename,
        letterTypeID: {
          [Sequelize.Op.ne]: letterTypeID,
        },
        status: ['0', '1'],
      },
    });

    if (existingLetterType) {
      return res.status(200).json({
        status: 401,
        message: 'Latter Template name already exists.',
      });
    }

    await letterTemplateType.update(
      {
        letterTypename,
        status,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { letterTypeID },
      }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.updateMessage('Letter Template '),
      });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteLetterTypeById = async (req, res, next) => {
  try {
    let { letterTypeID } = await req.body;

    let data = await letterField.findOne({
      where: {
        letterTypeID,
        status: ['0', '1'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Letter Template Type.Already used in Letter Fields/Letter Template Editor.',
      });
    } else {
      letterTemplateType.update(
        {
          status: 2,
        },
        {
          where: { letterTypeID },
        }
      );

      return res
        .status(200)
        .json({
          status: 200,
          message: message.usermessage.deleteMessage('Letter Template '),
        });
    }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { letterTypeID, status } = await req.body;

    if (status != '1') {
      let data = await letterField.findOne({
        where: {
          letterTypeID: letterTypeID,
          status: ['0', '1'],
        },
      });

      let data1 = await letterTemplateEditor.findOne({
        where: {
          letterTypeID: letterTypeID,
          status: ['0', '1'],
        },
      });

      if (data || data1) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not delete this Letter Template Type.Already used in Letter Fields/Letter Template Editor.',
        });
      }
    }
    await letterTemplateType.update(
      {
        status,
      },
      {
        where: { letterTypeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Letter  Template')
          : message.usermessage.deactiveMessage(' Letter Template'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all Active  bank data
 */
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
        { bankName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await letterTemplateType.findAndCountAll({
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
