const Sequelize = require('sequelize');
// const userIp = require('../models/userIP');
const DealerPlan = require('../models/dealerPlan');
const dealerSubscription = require('../models/dealersubscription');
const { executeQuery } = require('./common.controller');
const message = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const dealerPlan = require('../models/dealerPlan');

// add api
exports.postadddata = async (req, res, next) => {
  try {
    const { userMasterID, dealerPlanID, noOfEmployee, noOfCompany } =
      await req.body;

    await dealerSubscription.create(
      {
        userMasterID,
        dealerPlanID,
        noOfEmployee,
        noOfCompany,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.createByIp,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Dealer Subscription'),
    });
  } catch (err) {
    next(err);
  }
};

// get all data api
exports.listdata = async (req, res, next) => {
  try {
    let { page, limit } = req.body;

    const condition = {};

    // if (searchQuery)
    //     condition[Sequelize.Op.or] = [
    //         { planName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
    //     ];

    const paginationQuery = {}
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows, count } = await dealerSubscription.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [{ model: dealerPlan }, { model: UserMaster }],
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

exports.getdataid = async (req, res, next) => {
  try {
    const dealerSubscriptionID = req.params.id;
    const Data = await dealerSubscription.findOne({
      where: {
        dealerSubscriptionID,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });
    if (!Data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }

    return res.status(200).json({ status: 200, data: Data });
  } catch (err) {
    next(err);
  }
};

exports.editdata = async (req, res, next) => {
  try {
    let { dealerPlanID, noOfEmployee, noOfCompany } = await req.body;

    const currentdata = await dealerSubscription.findOne({
      where: {
        dealerPlanID: req.params.id,
      },
    });

    if (!currentdata)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.deletedrecord,
      });

    currentdata.dealerPlanID = dealerPlanID;
    currentdata.noOfEmployee = noOfEmployee;
    currentdata.noOfCompany = noOfCompany;

    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Dealer Subscription'),
    });
  } catch (error) {
    next(error);
  }
};
