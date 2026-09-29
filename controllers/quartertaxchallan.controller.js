const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const QuarterChallanMaster = require('../models/quartertaxchallan');
const logger = require('../config/logger');
const message = require('../response_message/message');

exports.postSaveQuarterTaxChallan = async (req, res, next) => {
  try {
    let = {
      userMasterID,
      YearMonth,
      Quarters,
      TDSReceipt,
      EmpAmtCredited,
      EmpAmtTaxDeducted,
      EmpTaxDeposited,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status;
    await sequelize.transaction(async (t) => {
      insert_db_status = await QuarterChallanMaster.create(
        {
          userMasterID,
          YearMonth,
          Quarters,
          TDSReceipt,
          EmpAmtCredited,
          EmpAmtTaxDeducted,
          EmpTaxDeposited,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.quartertaxchallansave,
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

exports.postReturnAllQuarterTaxChallan = async (req, res, next) => {
  try {
    let = { page, limit } = await req.body;
    let offset = (page - 1) * limit;
    let get_data;
    if (page == '' && limit == '') {
      get_data = await QuarterChallanMaster.findAll({
        order: [['createdAt', 'ASC']],
        where: { Status: [0, 1] },
        include: [{ all: true, nested: true }],
      });
    } else {
      get_data = await QuarterChallanMaster.findAll({
        limit: limit,
        offset: offset,
        order: [['createdAt', 'ASC']],
        where: { Status: [0, 1] },
        include: [{ all: true, nested: true }],
      });
    }
    const totalcount = await QuarterChallanMaster.count({
      where: { Status: ['0', '1'] },
      raw: true,
    });

    res
      .status(200)
      .json({ status: 200, data: get_data, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postDeleteQuarterTaxChallan = async (req, res, next) => {
  try {
    let = { QuarterTaxChallanID } = await req.body;
    let delete_status;
    await sequelize.transaction(async (t) => {
      delete_status = await QuarterChallanMaster.update(
        {
          Status: 2,
        },
        {
          where: { QuarterTaxChallanID: QuarterTaxChallanID },
          transaction: t,
        }
      );
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.quartertaxchallandelete,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postUpdateQuarterTaxChallan = async (req, res, next) => {
  try {
    let = {
      QuarterTaxChallanID,
      YearMonth,
      Quarters,
      TDSReceipt,
      EmpAmtCredited,
      EmpAmtTaxDeducted,
      EmpTaxDeposited,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_data;
    await sequelize.transaction(async (t) => {
      change_data = await QuarterChallanMaster.update(
        {
          YearMonth,
          Quarters,
          TDSReceipt,
          EmpAmtCredited,
          EmpAmtTaxDeducted,
          EmpTaxDeposited,
          updateBy,
          updateByIp,
        },
        {
          where: { QuarterTaxChallanID: QuarterTaxChallanID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.quartertaxchallanupdate,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message });
    }
    next(err);
  }
};

exports.postReturnbyUserMasterIdandyearMonth = async (req, res, next) => {
  try {
    let = { userMasterID, YearMonth } = await req.body;
    let get_data = await QuarterChallanMaster.findOne({
      where: {
        userMasterID: userMasterID,
        YearMonth: YearMonth,
      },
      include: { all: true, nested: true },
    });
    if (!get_data) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.quartertaxchallannotfound,
      });
    }
    res.status(200).json({ status: 200, data: get_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message });
    }
    next(err);
  }
};

exports.getReturnById = async (req, res, next) => {
  try {
    let get_one_data = await QuarterChallanMaster.findOne({
      where: {
        Status: [0, 1],
        QuarterTaxChallanID: req.params.id,
      },
    });

    if (!get_one_data) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.quartertaxchallannotfound,
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

exports.poststatus = async (req, res, next) => {
  try {
    let { QuarterTaxChallanID, Status } = await req.body;
    let delete_status;

    let result = await sequelize.transaction(async (t) => {
      if (Status == '1') {
        delete_status = await QuarterTaxChallan.update(
          {
            Status: '1',
          },
          {
            where: {
              QuarterTaxChallanID: QuarterTaxChallanID,
              Status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await QuarterTaxChallan.update(
          {
            Status: '0',
          },
          {
            where: {
              QuarterTaxChallanID: QuarterTaxChallanID,
              Status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.quartertaxchallandelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.quartertaxchallannotfound,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};
