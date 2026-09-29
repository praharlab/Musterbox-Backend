const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const TdsSlabMaster = require('../models/tdsslabmaster');
const message = require('../response_message/message');
const logger = require('../config/logger');

exports.postSaveTdsSlabMaster = async (req, res, next) => {
  try {
    let = { YearMonth, FromAmount, ToAmount, TdsRate, createBy, createByIp } =
      await req.body;
    let insert_db_status;
    await sequelize.transaction(async (t) => {
      insert_db_status = await TdsSlabMaster.create(
        {
          YearMonth,
          FromAmount,
          ToAmount,
          TdsRate,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.tdsslabmasterdata,
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

exports.postReturnAllTdsSlabMaster = async (req, res, next) => {
  try {
    let = { page, limit } = req.body;
    let offset = (page - 1) * limit;
    let tdsslabmaster_details;
    if (page == '' && limit == '') {
      tdsslabmaster_details = await TdsSlabMaster.findAll({
        order: [['createdAt', 'ASC']],
        where: { Status: [0, 1] },
      });
    } else {
      tdsslabmaster_details = await TdsSlabMaster.findAll({
        offset: offset,
        limit: limit,
        order: [['createdAt', 'ASC']],
        where: { Status: [0, 1] },
      });
    }
    const totalcount = await TdsSlabMaster.count({
      raw: true,
      where: { Status: ['0', '1'] },
    });

    res.status(200).json({
      status: 200,
      data: tdsslabmaster_details,
      totalcount: totalcount,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message });
    }
    next(err);
  }
};

exports.postDeleteTdsSlabMaster = async (req, res, next) => {
  try {
    let = { TdsSlabMasterID } = await req.body;
    await sequelize.transaction(async (t) => {
      let delete_status = await TdsSlabMaster.update(
        {
          Status: 2,
        },
        {
          where: { TdsSlabMasterID: TdsSlabMasterID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.TdsSlabMasterdeleted,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postUpdateTdsSlabMaster = async (req, res, next) => {
  try {
    let = {
      TdsSlabMasterID,
      YearMonth,
      FromAmount,
      ToAmount,
      TdsRate,
      updateBy,
      updateByIp,
    } = await req.body;
    await sequelize.transaction(async (t) => {
      let update_status = await TdsSlabMaster.update(
        {
          YearMonth,
          FromAmount,
          ToAmount,
          TdsRate,
          updateBy,
          updateByIp,
        },
        { where: { TdsSlabMasterID: TdsSlabMasterID }, transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.TdsSlabMasterupdated,
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

exports.postReturnTDSslabmasterbyIdandYearMonth = async (req, res, next) => {
  try {
    let = { TdsSlabMasterID, YearMonth } = await req.body;
    let get_data = await TdsSlabMaster.findOne({
      where: {
        TdsSlabMasterID: TdsSlabMasterID,
        YearMonth: YearMonth,
      },
      include: { all: true, nested: true },
    });

    if (!get_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.TDSslabnotfound });
    }
    res.status(200).json({ status: 200, data: get_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ stauts: 200, message: err.message, data: {} });
    }
  }
};

exports.getReturnById = async (req, res, next) => {
  try {
    let get_one_data = await TdsSlabMaster.findOne({
      where: {
        Status: [0, 1],
        TdsSlabMasterID: req.params.id,
      },
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.TDSslabnotfound });
    }
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message });
    }
    next(err);
  }
};

exports.postchangestatusTdsSlabMaster = async (req, res, next) => {
  try {
    let = { TdsSlabMasterID, Status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (Status == '1') {
        delete_status = await TdsSlabMaster.update(
          {
            Status: '1',
          },
          {
            where: { TdsSlabMasterID: TdsSlabMasterID, Status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await TdsSlabMaster.update(
          {
            Status: '0',
          },
          {
            where: { TdsSlabMasterID: TdsSlabMasterID, Status: ['1', '0'] },
            transaction: t,
          }
        );
      }
      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.TdsSlabMasterupdated,
        });
      } else {
        res
          .status(200)
          .json({ status: 200, message: message.usermessage.TDSslabnotfound });
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
