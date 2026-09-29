const Sequelize = require('sequelize');
const VisitReportFieldValueModel = require('../models/visitreportcustomizevalue');
const logger = require('../config/logger');
const message = require('../response_message/message');
/**
 * save VisitReportFieldValueModel data.
 *
 * @body {createBy} createBy user id of user who added the VisitReportFieldValueModel.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddVisitReportCustomizeFieldValue = async (req, res, next) => {
  try {
    let = { visitReportCustomizeID, visitID, value, createBy, createByIp } =
      await req.body;
    let insert_db_status = await VisitReportFieldValueModel.create({
      visitReportCustomizeID,
      visitID,
      value,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitreportcustomizevalueadd,
      data: insert_db_status,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 return all VisitReportFieldValueModel data
 */

exports.getAllVisitReportCustomizeFieldValueData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let VisitReportCustomizeFieldValue = [];
    if (limit == '' && page == '') {
      VisitReportCustomizeFieldValue = await VisitReportFieldValueModel.findAll(
        {
          where: {
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          include: [{ all: true, nested: true }],
        }
      );
    } else {
      VisitReportCustomizeFieldValue = await VisitReportFieldValueModel.findAll(
        {
          where: {
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          limit: limit,
          offset: offset,
          include: [{ all: true, nested: true }],
        }
      );
    }

    const totalcount = await VisitReportFieldValueModel.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res.status(200).json({
      status: 200,
      data: VisitReportCustomizeFieldValue,
      totalcount: totalcount,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with VisitReportFieldValueModel id
 *
 * @param {id} visitFormCustomizeValueID  to fetch visitPurpose name
 */

exports.getVisitReportCustomizeFieldValueById = async (req, res, next) => {
  try {
    let get_one_data = await VisitReportFieldValueModel.findAll({
      where: {
        visitID: req.params.id,
      },
      include: [{ all: true }],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with company master id
 *
 * @param {id} companyMasterID  to fetch VisitReportFieldValueModel name
 */

exports.getVisitReportCustomizeFieldValueByCompanyId = async (
  req,
  res,
  next
) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let VisitReportCustomizeFieldValue;
    if (page == '' && limit == '') {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await companyMasterModel.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },
        raw: true,
        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      VisitReportCustomizeFieldValue = await VisitReportFieldValueModel.findAll(
        {
          where: {
            companyMasterID: {
              [Sequelize.Op.in]: companyid,
            },
            status: 1,
          },
          include: [{ all: true, nested: true }],
        }
      );
    } else {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await companyMasterModel.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },
        raw: true,
        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }

      VisitReportCustomizeFieldValue = await VisitReportFieldValueModel.findAll(
        {
          where: {
            companyMasterID: {
              [Sequelize.Op.in]: companyid,
            },
            status: ['0', '1'],
          },
          limit: limit,
          offset: offset,
          include: [{ all: true, nested: true }],
        }
      );
    }
    const companyid = [];
    companyid.push(parseInt(req.body.id));
    let get_one_data = await companyMasterModel.findAll({
      where: { parentCompanyMasterID: req.body.id, status: [0, 1] },
      raw: true,
      include: [{ all: true, nested: true }],
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    const totalcount = await VisitReportFieldValueModel.count({
      raw: true,
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: ['0', '1'],
      },
      include: [{ all: true, nested: true }],
    });

    res.status(200).json({
      status: 200,
      data: VisitReportCustomizeFieldValue,
      totalcount: totalcount,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} VisitReportFieldValueModel  to update id
 */
exports.postUpdateVisitReportCustomizeFieldValue = async (req, res, next) => {
  try {
    let = {
      visitReportCustomizeValueID,
      visitReportCustomizeID,
      visitID,
      value,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_data_status = await VisitReportFieldValueModel.update(
      {
        visitReportCustomizeID,
        visitID,
        value,
        updateBy,
        updateByIp,
      },
      {
        where: { visitReportCustomizeValueID: visitReportCustomizeValueID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitreportcustomizevalueupdate,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} VisitReportFieldValueModel  to delete id
 */
exports.postDeleteVisitReportCustomizeFieldValueById = async (
  req,
  res,
  next
) => {
  try {
    let = { visitReportCustomizeValueID } = await req.body;
    let delete_status = await VisitReportFieldValueModel.update(
      {
        status: 2,
      },
      {
        where: { visitReportCustomizeValueID: visitReportCustomizeValueID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitreportcustomizevaluedelete,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postAddBulkVisitReportCustomizeFieldValue = async (req, res, next) => {
  try {
    let insert_db_status = await VisitReportFieldValueModel.bulkCreate(
      req.body,
      { returning: true }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitreportcustomizevalueadd,
      data: insert_db_status,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
