const logger = require('../config/logger');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const InvestmentDetails = require('../models/investmentdetails');
const message = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const Form16child = require('../models/form16child');
const Form16 = require('../models/form16');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

/*
 *to save investment details to database
 */
exports.postSaveInvestmentDetails = async (req, res, next) => {
  try {
    let = {
      userMasterID,
      Form16ChildID,
      InvestmentName,
      InvestmentAmount,
      YearMonth,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status;
    await sequelize.transaction(async (t) => {
      insert_db_status = await InvestmentDetails.create(
        {
          userMasterID,
          Form16ChildID,
          InvestmentName,
          InvestmentAmount,
          YearMonth,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.AddInvestmentDetails,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/*
 *to get all investment details
 */
exports.postReturnAllInvestmentDetails = async (req, res, next) => {
  try {
    let = { page, limit } = req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const investment_details = await InvestmentDetails.findAll({
      order: [['createdAt', 'ASC']],
      ...paginationQuery,
      where: { Status: [0, 1] },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [{ model: companyMaster }],
        },
        { model: Form16child, include: [{ model: Form16 }] },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: investment_details.rows,
      totalcount: investment_details.count,
    });
  } catch (err) {
    next(err);
  }
};

/*
 *to delete investment detail by id
 */
exports.postDeleteInvestmentDetails = async (req, res, next) => {
  try {
    let = { InvestmentDetailsID } = await req.body;
    await sequelize.transaction(async (t) => {
      let delete_status = await InvestmentDetails.update(
        {
          Status: 2,
        },
        {
          where: { InvestmentDetailsID: InvestmentDetailsID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.Investmentdetailsdeleted,
      });
    });
  } catch (err) {
    next(err);
  }
};

/*
 *to update investment details by id
 */
exports.postUpdateInvestmentDetails = async (req, res, next) => {
  try {
    let = {
      InvestmentDetailsID,
      userMasterID,
      Form16ChildID,
      InvestmentName,
      InvestmentAmount,
      YearMonth,
      updateBy,
      updateByIp,
    } = await req.body;
    await sequelize.transaction(async (t) => {
      let update_status = await InvestmentDetails.update(
        {
          userMasterID,
          Form16ChildID,
          InvestmentName,
          InvestmentAmount,
          YearMonth,
          updateBy,
          updateByIp,
        },
        { where: { InvestmentDetailsID: InvestmentDetailsID }, transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.Investmentdetailsupdated,
      });
      return update_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.postGetByUserMasterIdandYearmonth = async (req, res, next) => {
  try {
    let = { userMasterID, YearMonth } = await req.body;
    let get_data = await InvestmentDetails.findOne({
      where: {
        userMasterID: userMasterID,
        YearMonth: YearMonth,
      },
      include: { all: true, nested: true },
    });

    if (!get_data) {
      res.stauts(200).json({
        status: 200,
        message: message.usermessage.investmentdetailsnotfound,
      });
    }
    res.status(200).json({ status: 200, data: get_data });
  } catch (err) {
    next(err);
  }
};

exports.getReturnById = async (req, res, next) => {
  try {
    let get_one_data = await InvestmentDetails.findOne({
      where: {
        InvestmentDetailsID: req.params.id,
        Status: [0, 1],
      },
      include: [
        { model: UserMaster, include: [{ model: companyMaster }] },
        { model: Form16child, include: [{ model: Form16 }] },
      ],
    });

    if (!get_one_data) {
      return res.status(200).json({
        stauts: 200,
        message: message.usermessage.investmentdetailsnotfound,
      });
    }
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.poststatus = async (req, res, next) => {
  try {
    let { InvestmentDetailsID, Status } = await req.body;
    let delete_status;

    let result = await sequelize.transaction(async (t) => {
      if (Status == '1') {
        delete_status = await InvestmentDetails.update(
          {
            Status: '1',
          },
          {
            where: {
              InvestmentDetailsID: InvestmentDetailsID,
              Status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await InvestmentDetails.update(
          {
            Status: '0',
          },
          {
            where: {
              InvestmentDetailsID: InvestmentDetailsID,
              Status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.Investmentdetailsdeleted,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.investmentdetailsnotfound,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};
