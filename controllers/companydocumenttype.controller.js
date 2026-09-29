const Sequelize = require('sequelize');
const CompanyDocumentType = require('../models/companyDocumentType');
const CompanyMasterModel = require('../models/companyMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyDocument = require('../models/companyDocument');
/**
 * save companyDocumentType data.
 *
 * @body {createBy} createBy user id of user who added the companyDocumentType.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddCompanyDocumentType = async (req, res, next) => {
  try {
    const { documentName, createByIp } = await req.body;

    const existingCompanyDocumentType = await CompanyDocumentType.findOne({
      where: {
        documentName,
        status: ['0', '1'],
      },
    });

    if (existingCompanyDocumentType) {
      return res.status(200).json({
        status: 401,
        message: 'Company Document name already exists.',
      });
    }

    let insert_db_status = await CompanyDocumentType.create({
      documentName,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Company Document name'),
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all companyDocumentType data
 */

exports.getAllCompanyDocumentTypeData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: [0, 1],
    };

    const { rows, count } = await CompanyDocumentType.findAndCountAll({
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
 * find data with companyDocumentType id
 *
 * @param {id} companyDocumentTypeID  to fetch companyDocumentType name
 */

exports.getCompanyDocumentTypeById = async (req, res, next) => {
  try {
    let get_one_data = await CompanyDocumentType.findOne({
      where: {
        companyDocumentTypeID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
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
 * @param {id} companyDocumentTypeID  to update id
 */
exports.postUpdateCompanyDocumentType = async (req, res, next) => {
  try {
    let = { companyDocumentTypeID, documentName, updateBy, updateByIp } =
      await req.body;

    const existingCompanyDocumentType = await CompanyDocumentType.findOne({
      where: {
        documentName,
        companyDocumentTypeID: {
          [Sequelize.Op.ne]: companyDocumentTypeID,
        },
        status: ['0', '1'],
      },
    });

    if (existingCompanyDocumentType) {
      return res.status(200).json({
        status: 401,
        message: 'Company Document name already exists.',
      });
    }

    await CompanyDocumentType.update(
      {
        documentName,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { companyDocumentTypeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage(' Company Document list'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} companyDocumentTypeID  to update status of companyDocumentType
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { companyDocumentTypeID, status } = await req.body;

    if (status != '1') {
      let data = await companyDocument.findOne({
        where: {
          companyDocumentTypeID,
          status: ['1', '0'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this company document.Already assigned to employees.',
        });
      }
    }
    await CompanyDocumentType.update(
      {
        status,
      },
      {
        where: {
          companyDocumentTypeID,
        },
      }
    );
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Company Document name')
          : message.usermessage.deactiveMessage('Company Document name'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} companyDocumentTypeID  to delete id
 */
exports.postDeleteCompanyDocumentTypeById = async (req, res, next) => {
  try {
    let { companyDocumentTypeID } = await req.body;

    let data = await companyDocument.findOne({
      where: {
        companyDocumentTypeID,
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this company document.Already assigned to employees.',
      });
    } else {
      CompanyDocumentType.update(
        {
          status: 2,
        },
        {
          where: { companyDocumentTypeID },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Company Document name'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getActiveCompanyDocumentTypeData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: 1,
    };

    const { rows, count } = await CompanyDocumentType.findAndCountAll({
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
