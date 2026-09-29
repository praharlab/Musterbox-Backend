const Sequelize = require('sequelize');
const DocumentList = require('../models/documentList');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserDocument = require('../models/userDocument');
/**
 * save documentList data.
 *
 * @body {createBy} createBy user id of user who added the documentList.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddDocumentList = async (req, res, next) => {
  try {
    let = { documentName, createByIp } = await req.body;

    const existingDocumentType = await DocumentList.findOne({
      where: {
        documentName,
        status: ['0', '1'],
      },
    });

    if (existingDocumentType) {
      return res.status(200).json({
        status: 401,
        message: 'Document name already exists.',
      });
    }

    let insert_db_status = await DocumentList.create({
      documentName,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Document name'),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all documentList data
 */

exports.getAllDocumentListData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: [0, 1],
    };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { documentName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await DocumentList.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: [['documentName', 'ASC']],
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
 * find data with documentList id
 *
 * @param {id} documentListID  to fetch documentList name
 */

exports.getDocumentListById = async (req, res, next) => {
  try {
    let get_one_data = await DocumentList.findOne({
      where: {
        documentListID: req.params.id,
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
 * @param {id} documentListID  to update id
 */
exports.postUpdateDocumentList = async (req, res, next) => {
  try {
    let { documentListID, documentName, updateByIp } = await req.body;

    const existingDocumentType = await DocumentList.findOne({
      where: {
        documentName,
        documentListID: {
          [Sequelize.Op.ne]: documentListID,
        },
        status: ['0', '1'],
      },
    });

    if (existingDocumentType) {
      return res.status(200).json({
        status: 401,
        message: 'Document name already exists.',
      });
    }

    await DocumentList.update(
      {
        documentName,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { documentListID },
      }
    );
    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.updateMessage('Document list'),
      });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} documentListID  to update status of documentList
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { documentListID, status } = await req.body;

    if (status != '1') {
      let data = await UserDocument.findOne({
        where: {
          documentListID,
          status: ['1', '0'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactive this Document Type.Already used in User Doument.',
        });
      }
    }
    await DocumentList.update(
      {
        status,
      },
      {
        where: { documentListID },
      }
    );
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Document')
          : message.usermessage.deactiveMessage('Document'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} documentListID  to delete id
 */
exports.postDeleteDocumentListById = async (req, res, next) => {
  try {
    let { documentListID } = await req.body;

    let data = await UserDocument.findOne({
      where: {
        documentListID: documentListID,

        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this document.Already assigned to employees.',
      });
    } else {
      DocumentList.update(
        {
          status: 2,
        },
        {
          where: { documentListID },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Document list'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getActiveDocumentTypeData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

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
        { documentName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await DocumentList.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: [['documentName', 'ASC']],
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
