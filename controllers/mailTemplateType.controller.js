const mailTemplateType = require('../models/mailTemplateType');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const mailField = require('../models/mailFields');
const mailTemplateEditor = require('../models/mailTemplateEditor');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddMailType = async (req, res, next) => {
  try {
    let = { mailTypename, status, createByIp } = await req.body;

    const existingMailType = await mailTemplateType.findOne({
      where: {
        mailTypename,
        status: ['0', '1'],
      },
    });

    if (existingMailType) {
      return res.status(200).json({
        status: 401,
        message: 'Mail Template name already exists.',
      });
    }
    let insert_db_status = await mailTemplateType.create({
      mailTypename,
      status,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Mail Template '),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all city data
 */

exports.getAllMailType = async (req, res, next) => {
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
        { mailTypename: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const order = [['mailTypename', 'ASC']];

    const { rows, count } = await mailTemplateType.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
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

/**
 * find data with CompanyType id
 *
 * @param {id} mailTypeID  to fetch city name
 */

exports.getMailTypeId = async (req, res, next) => {
  try {
    let get_one_data = await mailTemplateType.findOne({
      where: { mailTypeID: req.params.id, status: ['0', '1'] },
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
 * @param {id} CompanyTypeID  to update id
 */
exports.postUpdatMailType = async (req, res, next) => {
  try {
    let = { mailTypeID, mailTypename, status, updateByIp } = await req.body;

    const existingMailType = await mailTemplateType.findOne({
      where: {
        mailTypename,
        mailTypeID: {
          [Sequelize.Op.ne]: mailTypeID,
        },
        status: ['0', '1'],
      },
    });

    if (existingMailType) {
      return res.status(200).json({
        status: 401,
        message: 'Mail Template name already exists.',
      });
    }

    await mailTemplateType.update(
      {
        mailTypename,
        status,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { mailTypeID },
      }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.updateMessage('Mail Template '),
      });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} CompanyTypeID  to delete id
 */
exports.postDeleteMailTypeById = async (req, res, next) => {
  try {
    let { mailTypeID } = await req.body;

    let data = await mailField.findOne({
      where: {
        mailTypeID,
        status: ['0', '1'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Mail Template Type.Already used in Mail Fields/Mail Template Editor.',
      });
    } else {
      await mailTemplateType.update(
        {
          status: 2,
        },
        {
          where: { mailTypeID },
        }
      );
      return res
        .status(200)
        .json({
          status: 200,
          message: message.usermessage.deleteMessage('Mail Template '),
        });
    }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { mailTypeID, status } = req.body;

    if (status != '1') {
      let mailFieldData = await mailField.findOne({
        where: {
          mailTypeID: mailTypeID,
          status: ['0', '1'],
        },
      });

      let mailTemplateEditorData = await mailTemplateEditor.findOne({
        where: {
          mailTypeID: mailTypeID,
          status: ['0', '1'],
        },
      });

      if (mailFieldData || mailTemplateEditorData) {
        return res.status(200).json({
          status: 401,
          message:
            'You cannot deactivate this Mail Template Type. Already used in Mail Fields/Mail Template Editor.',
        });
      }
    }

    await mailTemplateType.update(
      {
        status,
      },
      {
        where: { mailTypeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Mail Template ')
          : message.usermessage.deactiveMessage('Mail Template '),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all Active  bank data
 */
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
        { bankName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await mailTemplateType.findAndCountAll({
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
