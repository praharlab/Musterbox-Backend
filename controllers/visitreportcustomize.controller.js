const Sequelize = require('sequelize');
const VisitReportCustomizeModel = require('../models/visitreportcustomize');
const logger = require('../config/logger');
const message = require('../response_message/message');
const VisitReportMaster = require('../models/visitReportMaster');
/**
 * save VisitReportCustomize data.
 *
 * @body {createBy} createBy user id of user who added the Visit Form Customize.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddVisitReportCustomize = async (req, res, next) => {
  try {
    let = {
      fieldLabel,
      inputType,
      value,
      isRequired,
      companyMasterID,
      visitReportMasterID,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status = await VisitReportCustomizeModel.create({
      fieldLabel,
      inputType,
      value,
      isRequired,
      companyMasterID,
      visitReportMasterID,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitreportcustomizeadd,
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
 return all VisitReportCustomize data
 */

exports.getAllVisitReportCustomizeData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let visitreportcustomize = [];
    if (limit == '' && page == '') {
      visitreportcustomize = await VisitReportCustomizeModel.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      visitreportcustomize = await VisitReportCustomizeModel.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
    }

    const totalcount = await VisitReportCustomizeModel.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res.status(200).json({
      status: 200,
      data: visitreportcustomize,
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
 * find data with VisitReportCustomize id
 *
 * @param {id} VisitReportCustomizeID  to fetch VisitReportCustomize name
 */

exports.getVisitReportCustomizeById = async (req, res, next) => {
  try {
    let get_one_data = await VisitReportCustomizeModel.findOne({
      where: {
        visitReportCustomizeID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ all: true, nested: true }],
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
 * @param {id} companyMasterID  to fetch VisitReportCustomize name
 */

exports.getVisitReportCustomizeByCompanyId = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let visitreportcustomize;
    const order = [['visitReportCustomizeID', 'ASC']];
    if (page == '' && limit == '') {
      visitreportcustomize = await VisitReportCustomizeModel.findAll({
        where: {
          companyMasterID: req.body.companyMasterID,
          visitReportMasterID: req.body.report_id,
          status: 1,
        },
        order,
        include: [{ model: VisitReportMaster }],
      });
    } else {
      visitreportcustomize = await VisitReportCustomizeModel.findAll({
        where: {
          companyMasterID: req.body.companyMasterID,
          visitReportMasterID: req.body.report_id,
          status: 1,
        },
        order,
        limit: limit,
        offset: offset,
        include: [{ model: VisitReportMaster }],
      });
    }
    const totalcount = await VisitReportCustomizeModel.count({
      raw: true,
      where: {
        companyMasterID: req.body.companyMasterID,
        visitReportMasterID: req.body.report_id,
        status: ['0', '1'],
      },
    });

    res.status(200).json({
      status: 200,
      data: visitreportcustomize,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} VisitReportCustomizeID  to update id
 */
exports.postUpdateVisitReportCustomize = async (req, res, next) => {
  try {
    let = {
      visitReportCustomizeID,
      fieldLabel,
      inputType,
      value,
      isRequired,
      companyMasterID,
      visitReportMasterID,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_data_status = await VisitReportCustomizeModel.update(
      {
        fieldLabel,
        inputType,
        value,
        isRequired,
        companyMasterID,
        visitReportMasterID,
        updateBy,
        updateByIp,
      },
      {
        where: { visitReportCustomizeID: visitReportCustomizeID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitreportcustomizeupdate,
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
 * @param {id} VisitReportCustomizeID  to delete id
 */
exports.postDeleteVisitReportCustomizeById = async (req, res, next) => {
  try {
    let = { visitReportCustomizeID } = await req.body;
    let delete_status = await VisitReportCustomizeModel.update(
      {
        status: 2,
      },
      {
        where: { visitReportCustomizeID: visitReportCustomizeID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitreportcustomizedelete,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
