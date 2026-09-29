const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMaster = require('../models/companyMaster');
const CompanyLetterFormat = require('../models/companyLetterFormat');

exports.postAddCompanyLetterFormat = async (req, res, next) => {
  try {
    let = { companyMasterID, letterName, letterFormat, createBy, createByIp } =
      await req.body;
    let insert_status;
    await sequelize.transaction(async (t) => {
      insert_status = await CompanyLetterFormat.create(
        {
          companyMasterID,
          letterName,
          letterFormat,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
    });

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.CompanyLetterAdd });
  } catch (err) {
    next(err);
  }
};

exports.postGetAllCompanyLetterFormat = async (req, res, next) => {
  try {
    let = { page, limit } = await req.body;
    let result;
    if (limit == '' && page == '') {
      result = await CompanyLetterFormat.findAll({
        where: { status: [0, 1] },
        include: [],
      });
    }
    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateCompanyLetterFormat = async (req, res, next) => {
  try {
    let = {
      companyLetterFormatID,
      companyMasterID,
      letterName,
      letterFormat,
      updateBy,
      updateByIp,
    } = await req.body;
    let update_data;
    await sequelize.transaction(async (t) => {
      update_data = await CompanyLetterFormat.update(
        {
          companyMasterID,
          letterName,
          letterFormat,
          updateBy,
          updateByIp,
        },
        {
          where: { companyLetterFormatID },
          transaction: t,
        }
      );
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.companyLetterFormatUpdated,
    });
  } catch (err) {
    next(err);
  }
};

exports.getReturnById = async (req, res, next) => {
  try {
    let get_one_data = await CompanyLetterFormat.findOne({
      where: {
        status: [0, 1],
        companyLetterFormatID: req.params.id,
      },
    });
    if (!get_one_data) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.letterFormatNotFound,
      });
    }
    res.status(200).json({ sttus: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteCompanyLetterFormat = async (req, res, next) => {
  try {
    let = { companyLetterFormatID } = await req.body;
    let delete_status;
    await sequelize.transaction(async (t) => {
      delete_status = await CompanyLetterFormat.update(
        {
          status: 2,
        },
        {
          where: { companyLetterFormatID },
          transaction: t,
        }
      );
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.companyLetterFormatDeleted,
    });
  } catch (eerr) {
    next(err);
  }
};
