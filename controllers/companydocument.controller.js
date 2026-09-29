const Sequelize = require('sequelize');
const CompanyDocument = require('../models/companyDocument');
const logger = require('../config/logger');
const message = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const CompanyDocumentType = require('../models/companyDocumentType');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

/**
 * save companyDocument data.
 *
 * @body {createBy} createBy user id of user who added the companyDocument.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddCompanyDocument = async (req, res, next) => {
  try {
    let = { userMasterID, companyDocumentTypeID, createBy, createByIp } =
      await req.body;
    let document = '';
    if (req.file) {
      document = req.file.filename;
    }
    let insert_db_status = await CompanyDocument.create({
      userMasterID,
      companyDocumentTypeID,
      document,
      createBy,
      createByIp,
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.companydocumentadd,
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all companyDocument data
 */

exports.getAllCompanyDocumentData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    condition.status = {
      [Sequelize.Op.in]: [0, 1],
    };

    const { company_document, count } = await CompanyDocument.findAll({
      where: condition,
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        { model: CompanyDocumentType, as: 'documentType' },
      ],
    });

    return res
      .status(200)
      .json({ status: 200, data: company_document, totalcount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with companyDocument id
 *
 * @param {id} companyDocumentID  to fetch companyDocument
 */

exports.getCompanyDocumentById = async (req, res, next) => {
  try {
    let get_one_data = await CompanyDocument.findOne({
      where: {
        companyDocumentID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        { model: UserMaster },
        { model: CompanyDocumentType, as: 'documentType' },
      ],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch userDocument
 */

exports.getUserDocumentByUserMasterId = async (req, res, next) => {
  try {
    const get_one_data = await CompanyDocument.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        { model: CompanyDocumentType, as: 'documentType' },
      ],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 get company document data by user id
 */

exports.getCompanyDocumentByUserId = async (req, res, next) => {
  try {
    const { limit, page, userMasterID } = await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    condition.status = [0, 1];

    condition.userMasterID = userMasterID;

    const { rows: company_document, count } =
      await CompanyDocument.findAndCountAll({
        where: condition,
        ...paginationQuery,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          { model: CompanyDocumentType, as: 'documentType' },
        ],
      });

    res
      .status(200)
      .json({ status: 200, data: company_document, totalcount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} companyDocumentID  to update id
 */
exports.postUpdateCompanyDocument = async (req, res, next) => {
  try {
    let = {
      companyDocumentID,
      companyDocumentTypeID,
      userMasterID,
      updateBy,
      updateByIp,
    } = await req.body;
    if (req.file) {
      let document = req.file.filename;
      let change_data_status = await CompanyDocument.update(
        {
          companyDocumentTypeID,
          userMasterID,
          document,
          updateBy,
          updateByIp,
        },
        {
          where: { companyDocumentID: companyDocumentID },
        }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.companydocumentupdate,
      });
    } else {
      let change_data_status = await CompanyDocument.update(
        {
          companyDocumentTypeID,
          updateBy,
          updateByIp,
        },
        {
          where: { companyDocumentID: companyDocumentID },
        }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.companydocumentupdate,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} companyDocumentID  to update status of companyDocument
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { companyDocumentID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await CompanyDocument.update(
        {
          status: '1',
        },
        {
          where: { companyDocumentID: companyDocumentID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await CompanyDocument.update(
        {
          status: '0',
        },
        {
          where: { companyDocumentID: companyDocumentID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.companydocumentdelete,
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} companyDocumentID  to delete id
 */
exports.postDeleteCompanyDocumentById = async (req, res, next) => {
  try {
    let = { companyDocumentID } = await req.body;
    let delete_status = await CompanyDocument.update(
      {
        status: 2,
      },
      {
        where: { companyDocumentID: companyDocumentID },
      }
    );
    res.status(200).json({
      status: 200,
      message: message.usermessage.companydocumentdelete,
    });
  } catch (err) {
    next(err);
  }
};
