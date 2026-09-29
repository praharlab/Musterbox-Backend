const letterHead = require('../models/letterHead');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const CompanyMaster = require('../models/companyMaster');
const sequelize = require('../config/database');

exports.AddletterHead = async (req, res, next) => {
  try {
    let {
      lettername,
      letterhtml,
      dynamicwords,
      status,
      companyMasterID,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await letterHead.create(
        {
          lettername,
          letterhtml,
          dynamicwords,
          status,
          companyMasterID,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.letterHeadAdd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err.message);
  }
};

exports.postUpdateLetterHead = async (req, res, next) => {
  try {
    let {
      letterID,
      lettername,
      letterhtml,
      dynamicwords,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await letterHead.update(
        {
          letterID,
          lettername,
          letterhtml,
          dynamicwords,
          updateBy,
          updateByIp,
        },
        {
          where: { letterID: letterID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.letterHeadUpdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteLetterheadById = async (req, res, next) => {
  try {
    let { letterID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await letterHead.update(
        {
          status: '2',
        },
        {
          where: { letterID: letterID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.letterHeadDelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getbyLetterheadId = async (req, res, next) => {
  try {
    let get_one_data = await letterHead.findOne({
      where: { letterID: req.params.id },
      raw: true,
    });

    if (!get_one_data) res.status(200).json({ status: 200 });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
exports.getalldatabyCompanyId = async (req, res, next) => {
  try {
    let { page, limit, company_id } = req.body;
    let offset = (page - 1) * limit;
    let get_one_data;
    let totalcount;

    if (page == '' && limit == '') {
      get_one_data = await letterHead.findAll({
        where: { companyMasterID: company_id, status: 1 },
      });
      totalcount = await letterHead.count({
        where: { companyMasterID: company_id, status: 1 },
      });
    } else {
      get_one_data = await letterHead.findAll({
        where: { companyMasterID: company_id, status: 1 },
        limit: limit,
        offset: offset,
      });
      totalcount = await letterHead.count({
        where: { companyMasterID: company_id, status: 1 },
      });
    }

    if (!get_one_data) res.status(200).json({ status: 200 });
    else
      res
        .status(200)
        .json({ status: 200, data: get_one_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};
