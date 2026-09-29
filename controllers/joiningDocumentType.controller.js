const Sequelize = require('sequelize');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const JoiningDocumentType = require('../models/joiningDocumentType');
const { generateExcel } = require('../utils/exportData');
const companyMaster = require('../models/companyMaster');
/**
 * save documentList data.
 *
 * @body {createBy} createBy user id of user who added the documentList.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.addJoinoingDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      companyMasterID,
      documentName,
      description,
      documentFileType,
      hasFromDate,
      hasIssueDate,
      hasExpiryDate,
      hasIdentificationNumber,
      setReminderForExpiry,
      reminderBeforeDays,
      reminderFrequency,
    } = await req.body;
    const condition = {
      companyMasterID: +companyMasterID,
      documentName: {
        [Sequelize.Op.iLike]: documentName.trim(),
      },
      status: [0, 1],
    };
    const existingDocumentType = await JoiningDocumentType.findOne(
      {
        where: condition,
      },
      { transaction }
    );
    if (existingDocumentType) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Joining Document Type'),
      });
    }

    await JoiningDocumentType.create(
      {
        documentName: documentName.trim(),
        description: description.trim(),
        documentFileType,
        hasFromDate,
        hasIssueDate,
        hasExpiryDate,
        hasIdentificationNumber,
        companyMasterID,
        setReminderForExpiry,
        reminderBeforeDays,
        reminderFrequency,
      },
      { user: req.userDetails, transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Joining Document Type'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.gettAllJoiningDocumentData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, companyMasterID, exportData, status } =
      await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: status ? status : [0, 1],
    };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { documentName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];
    condition.companyMasterID = companyMasterID;
    const { rows, count } = await JoiningDocumentType.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['documentName', 'ASC']],
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
      ],
    });

    if (exportData) {
      const finalExportData = rows.map((e) => {
        return {
          'Company Name': e.companyMaster.companyName,
          'Document Name': e.documentName,
          Description: e.description,
          'Accepted File Type': Array.isArray(e.documentFileType)
            ? e.documentFileType.join(', ')
            : e.documentFileType,
          'Has From Date': e.hasFromDate ? 'Yes' : 'No',
          'Has Issue Date': e.hasIssueDate ? 'Yes' : 'No',
          'Has Identification Number': e.hasIdentificationNumber ? 'Yes' : 'No',
          'Has Expiry Date': e.hasExpiryDate ? 'Yes' : 'No',
          'Set Reminder for Document Expiry': e.setReminderForExpiry ? 'Yes' : 'No',
          'Reminder Start Before Days': e.reminderBeforeDays,
          'Reminder Frequency': e.reminderFrequency,
        };
      });
      
      return await generateExcel(
        finalExportData,
        'Joining Document',
        'xlsx',
        res
      );
    }
    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getJoiningDocumentById = async (req, res, next) => {
  try {
    const { joiningDocumentMasterID } = req.query;
    const get_one_data = await JoiningDocumentType.findOne({
      where: {
        joiningDocumentMasterID: joiningDocumentMasterID,
      },
      raw: true,
    });
    if (!get_one_data) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Joining Document Type'),
      });
    }
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.updateJoiningDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      joiningDocumentMasterID,
      companyMasterID,
      documentName,
      description,
      documentFileType,
      hasFromDate,
      hasIssueDate,
      hasExpiryDate,
      hasIdentificationNumber,
      setReminderForExpiry,
      reminderBeforeDays,
      reminderFrequency,
    } = await req.body;
    const get_one_data = await JoiningDocumentType.findOne(
      {
        where: {
          joiningDocumentMasterID: joiningDocumentMasterID,
        },
        raw: true,
      },
      { transaction }
    );

    if (!get_one_data) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Joining Document Type'),
      });
    }

    const condition = {
      companyMasterID: +companyMasterID,
      documentName: {
        [Sequelize.Op.iLike]: documentName.trim(),
      },
      joiningDocumentMasterID: {
        [Sequelize.Op.notIn]: [joiningDocumentMasterID],
      },
      status: [0, 1],
    };

    const existingDocumentType = await JoiningDocumentType.findOne(
      {
        where: condition,
      },
      { transaction }
    );
    if (existingDocumentType) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Joining Document Type'),
      });
    }

    await JoiningDocumentType.update(
      {
        documentName,
        description,
        documentFileType,
        hasFromDate,
        hasIssueDate,
        hasExpiryDate,
        hasIdentificationNumber,
        setReminderForExpiry,
        reminderBeforeDays,
        reminderFrequency,
      },
      {
        where: { joiningDocumentMasterID },
      },
      { user: req.userDetails, transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Joining Document Type'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.statusChangesJoiningDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { joiningDocumentMasterID, status } = await req.body;

    const get_one_data = await JoiningDocumentType.findOne(
      {
        where: {
          joiningDocumentMasterID: joiningDocumentMasterID,
        },
        raw: true,
      },
      { transaction }
    );

    if (!get_one_data) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Joining Document Type'),
      });
    }
    await JoiningDocumentType.update(
      {
        status,
      },
      {
        where: { joiningDocumentMasterID },
      },
      { user: req.userDetails, transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Joining Document Type')
          : message.usermessage.deactiveMessage('Joining Document Type'),
      data: {},
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.deleteJoiningDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { joiningDocumentMasterID } = await req.body;
    const get_one_data = await JoiningDocumentType.findOne(
      {
        where: {
          joiningDocumentMasterID: joiningDocumentMasterID,
        },
        raw: true,
      },
      { transaction }
    );

    if (!get_one_data) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Joining Document Type'),
      });
    }

    await JoiningDocumentType.destroy(
      {
        where: { joiningDocumentMasterID },
      },
      { user: req.userDetails, transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Joining Document Type'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
