const sequelize = require('../config/database');
const TaxChallanMaster = require('../models/taxchallanmaster');
const Sequelize = require('sequelize');
const logger = require('../config/logger');
const message = require('../response_message/message');

exports.postSaveTaxChallanMaster = async (req, res, next) => {
  try {
    let = {
      userMasterID,
      YearMonth,
      SrNo,
      TaxDepositedAmt,
      BSRCode,
      TaxDepositedDate,
      ChallanSerialNo,
      Oltas,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status;
    await sequelize.transaction(async (t) => {
      insert_db_status = await TaxChallanMaster.create(
        {
          userMasterID,
          YearMonth,
          SrNo,
          TaxDepositedAmt,
          BSRCode,
          TaxDepositedDate,
          ChallanSerialNo,
          Oltas,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.taxchallanmasterdata,
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

exports.postReturnAllTaxChallanMaster = async (req, res, next) => {
  try {
    let = { page, limit } = await req.body;
    let offset = (page - 1) * limit;
    let taxchallanmaster_details;
    if (page == '' && limit == '') {
      taxchallanmaster_details = await TaxChallanMaster.findAll({
        order: [['createdAt', 'ASC']],
        where: { Status: [0, 1] },
        include: [{ all: true, nested: true }],
      });
    } else {
      taxchallanmaster_details = await TaxChallanMaster.findAll({
        offset: offset,
        limit: limit,
        order: [['createdAt', 'ASC']],
        where: { Status: [0, 1] },
        include: [{ all: true, nested: true }],
      });
    }
    const totalcount = await TaxChallanMaster.count({
      raw: true,
      where: { Status: ['0', '1'] },
    });

    res.status(200).json({
      status: 200,
      data: taxchallanmaster_details,
      totalcount: totalcount,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message });
    }
    next(err);
  }
};

exports.postDeleteTaxChallanMaster = async (req, res, next) => {
  try {
    let = { TaxChallanMasterID } = await req.body;
    await sequelize.transaction(async (t) => {
      let delete_status = await TaxChallanMaster.update(
        {
          Status: 2,
        },
        {
          where: { TaxChallanMasterID: TaxChallanMasterID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.TaxChallanMasterdeleted,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postUpdateTaxChallanMaster = async (req, res, next) => {
  try {
    let = {
      TaxChallanMasterID,
      userMasterID,
      YearMonth,
      SrNo,
      TaxDepositedAmt,
      BSRCode,
      TaxDepositedDate,
      ChallanSerialNo,
      Oltas,
      updateBy,
      updateByIp,
    } = await req.body;
    await sequelize.transaction(async (t) => {
      let update_status = await TaxChallanMaster.update(
        {
          userMasterID,
          YearMonth,
          SrNo,
          TaxDepositedAmt,
          BSRCode,
          TaxDepositedDate,
          ChallanSerialNo,
          Oltas,
          updateBy,
          updateByIp,
        },
        { where: { TaxChallanMasterID: TaxChallanMasterID }, transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.TaxChallanMasterupdated,
      });
      return update_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postReturnTaxChallanbyIdandTearMonth = async (req, res, next) => {
  try {
    let = { userMasterID, YearMonth } = await req.body;
    let get_data = await TaxChallanMaster.findOne({
      where: {
        userMasterID: userMasterID,
        YearMonth: YearMonth,
      },
      include: { all: true, nested: true },
    });
    if (!get_data) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.taxchallanmasternotfound,
      });
    }
    res.status(200).json({ stauts: 200, data: get_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getReturnById = async (req, res, next) => {
  try {
    let get_one_data = await TaxChallanMaster.findOne({
      where: {
        Status: [0, 1],
        TaxChallanMasterID: req.params.id,
      },
    });

    if (!get_one_data) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.taxchallanmasternotfound,
      });
    }
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message });
    }
    next(err);
  }
};

exports.postchangestatusTaxChallanMaster = async (req, res, next) => {
  try {
    let = { TaxChallanMasterID, Status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (Status == '1') {
        delete_status = await TaxChallanMaster.update(
          {
            Status: '1',
          },
          {
            where: {
              TaxChallanMasterID: TaxChallanMasterID,
              Status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await TaxChallanMaster.update(
          {
            Status: '0',
          },
          {
            where: {
              TaxChallanMasterID: TaxChallanMasterID,
              Status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }
      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.TaxChallanMasterupdated,
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.taxchallanmasternotfound,
        });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
