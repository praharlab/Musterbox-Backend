const Sequelize = require('sequelize');
const VisitFormCustomizeModel = require('../models/visitformcustomize');
const message = require('../response_message/message');

exports.postAddVisitFormCustomize = async (req, res, next) => {
  try {
    let = { fieldLabel, inputType, value, isRequired, companyMasterID } =
      await req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    await VisitFormCustomizeModel.create({
      fieldLabel,
      inputType,
      value,
      isRequired,
      companyMasterID,
      createBy,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Visit Form Customize'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllVisitFormCustomizeData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    const paginationQuery = {};

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: visit_purpose_data, count } =
      await VisitFormCustomizeModel.findAndCountAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        ...paginationQuery,
      });

    return res
      .status(200)
      .json({ status: 200, data: visit_purpose_data, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.getVisitFormCustomizeById = async (req, res, next) => {
  try {
    const get_one_data = await VisitFormCustomizeModel.findOne({
      where: {
        visitFormCustomizeID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getVisitFormCustomizeByCompanyId = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID } = await req.body;
    const paginationQuery = {};

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const { rows: visitformcustomize, count } =
      await VisitFormCustomizeModel.findAndCountAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
        ...paginationQuery,
      });

    return res
      .status(200)
      .json({ status: 200, data: visitformcustomize, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateVisitFormCustomize = async (req, res, next) => {
  try {
    let {
      visitFormCustomizeID,
      fieldLabel,
      inputType,
      value,
      isRequired,
      companyMasterID,
    } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await VisitFormCustomizeModel.update(
      {
        fieldLabel,
        inputType,
        value,
        isRequired,
        companyMasterID,
        updateBy,
        updateByIp,
      },
      {
        where: { visitFormCustomizeID: visitFormCustomizeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Visit Form Customize'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteVisitFormCustomizeById = async (req, res, next) => {
  try {
    let { visitFormCustomizeID } = await req.body;
    await VisitFormCustomizeModel.update(
      {
        status: 2,
      },
      {
        where: { visitFormCustomizeID: visitFormCustomizeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Visit Form Customize'),
    });
  } catch (err) {
    next(err);
  }
};
