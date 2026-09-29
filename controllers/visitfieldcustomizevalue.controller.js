const Sequelize = require('sequelize');
const VisitCustomizeFieldValueModel = require('../models/visitformcustomizevalue');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const VisitFormCustomize = require('../models/visitformcustomize');
/**
 * save VisitCustomizeFieldValueModel data.
 *
 * @body {createBy} createBy user id of user who added the VisitCustomizeFieldValueModel.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddVisitCustomizeFieldValueWeb = async (req, res, next) => {
  try {
    let = { customfieldvalue, visitID, createBy, createByIp } = await req.body;
    let insert_db_status;
    for (var i = 0; i < customfieldvalue.length; i++) {
      insert_db_status = await VisitCustomizeFieldValueModel.create({
        visitFormCustomizeID: customfieldvalue[i].visitFormCustomizeID,
        visitID: visitID,
        value: customfieldvalue[i].value,
        createBy: createBy,
        createByIp: createByIp,
      });
    }
    res.status(200).json({
      status: 200,
      message: message.usermessage.visitformcustomizevalueadd,
      data: {},
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postUpdateVisitCustomizeFieldValueWeb = async (req, res, next) => {
  try {
    let = {
      customfieldvalue,
      visitFormCustomizeID,
      visitID,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_data_status;
    for (var i = 0; i < customfieldvalue.length; i++) {
      change_data_status = await VisitCustomizeFieldValueModel.update(
        {
          visitFormCustomizeID,
          visitID,
          value: customfieldvalue[i].value,
          updateBy,
          updateByIp,
        },
        {
          where: {
            visitFormCustomizeValueID:
              customfieldvalue[i].visitFormCustomizeValueID,
          },
        }
      );
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitformcustomizevalueupdate,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postAddVisitCustomizeFieldValue = async (req, res, next) => {
  try {
    let = { visitFormCustomizeID, visitID, value, createBy, createByIp } =
      await req.body;
    let insert_db_status = await VisitCustomizeFieldValueModel.create({
      visitFormCustomizeID,
      visitID,
      value,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitformcustomizevalueadd,
      data: {},
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 return all VisitCustomizeFieldValueModel data
 */

exports.getAllVisitCustomizeFieldValueData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let VisitCustomizeFieldValue = [];
    if (limit == '' && page == '') {
      VisitCustomizeFieldValue = await VisitCustomizeFieldValueModel.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      VisitCustomizeFieldValue = await VisitCustomizeFieldValueModel.findAll({
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

    const totalcount = await VisitCustomizeFieldValueModel.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res.status(200).json({
      status: 200,
      data: VisitCustomizeFieldValue,
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
 * find data with VisitCustomizeFieldValueModel id
 *
 * @param {id} visitFormCustomizeValueID  to fetch visitPurpose name
 */

exports.getVisitCustomizeFieldValueById = async (req, res, next) => {
  try {
    let get_one_data = await VisitCustomizeFieldValueModel.findAll({
      where: {
        visitID: req.params.id,
      },
      include: [
        {
          model: VisitFormCustomize
        }
      ]
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
 * find data with company master id
 *
 * @param {id} companyMasterID  to fetch VisitCustomizeFieldValueModel name
 */

exports.getVisitCustomizeFieldValueByCompanyId = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let VisitCustomizeFieldValue;
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
      VisitCustomizeFieldValue = await VisitCustomizeFieldValueModel.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: 1,
        },
        include: [{ all: true, nested: true }],
      });
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

      VisitCustomizeFieldValue = await VisitCustomizeFieldValueModel.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
        },
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
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
    const totalcount = await VisitCustomizeFieldValueModel.count({
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
      data: VisitCustomizeFieldValue,
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
 * @param {id} VisitCustomizeFieldValueModel  to update id
 */
exports.postUpdateVisitCustomizeFieldValue = async (req, res, next) => {
  try {
    let = {
      visitFormCustomizeValueID,
      visitFormCustomizeID,
      visitID,
      value,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_data_status = await VisitCustomizeFieldValueModel.update(
      {
        visitFormCustomizeID,
        visitID,
        value,
        updateBy,
        updateByIp,
      },
      {
        where: { visitFormCustomizeValueID: visitFormCustomizeValueID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitformcustomizevalueupdate,
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
 * @param {id} VisitCustomizeFieldValueModel  to delete id
 */
exports.postDeleteVisitCustomizeFieldValueById = async (req, res, next) => {
  try {
    let = { visitFormCustomizeValueID } = await req.body;
    let delete_status = await VisitCustomizeFieldValueModel.update(
      {
        status: 2,
      },
      {
        where: { visitFormCustomizeValueID: visitFormCustomizeValueID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.visitformcustomizevaluedelete,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postAddBulkVisitCustomizeFieldValue = async (req, res, next) => {
  try {
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await VisitCustomizeFieldValueModel.bulkCreate(
        req.body,
        { returning: true, transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.visitformcustomizevalueadd,
        data: insert_db_status,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postUpdateBulkVisitCustomizeFieldValue = async (req, res, next) => {
  try {
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await VisitCustomizeFieldValueModel.bulkCreate(
        req.body,
        {
          updateOnDuplicate: ['value', 'updateBy', 'updateByIp', 'updatedAt'],
          where: { id: ['visitFormCustomizeValueID'] },
        },
        { returning: true, transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.visitformcustomizevalueupdate,
        data: insert_db_status,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
