const Sequelize = require('sequelize');
// const userIp = require('../models/userIP');
const DealerPlan = require('../models/dealerPlan');
const { executeQuery } = require('./common.controller');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const { generateExcel } = require('../utils/exportData');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const moment = require('moment');
const BranchMaster = require('../models/branchMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const Designation = require('../models/designation');
const EmployeeBranch = require('../models/employeeBranch');
const dealerPlan = require('../models/dealerPlan');

// add api
exports.postadddata = async (req, res, next) => {
  try {
    const {
      planName,
      Description,
      numberOfEmployee,
      numberOfCompany,
      features,
    } = await req.body;

    const dealer = await DealerPlan.findOne({
      where: {
        planName,
      },
    });

    if (dealer) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('DealerPlan'),
      });
    }

    await DealerPlan.create(
      {
        planName,
        Description,
        numberOfEmployee,
        numberOfCompany,
        features,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.createByIp,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('DealerPlan'),
    });
  } catch (err) {
    next(err);
  }
};

// get all data api
exports.listdata = async (req, res, next) => {
  try {
    let { page, limit, searchQuery } = req.body;

    const condition = {};

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { planName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const paginationQuery = {}
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows, count } = await DealerPlan.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: [['dealerPlanID', 'DESC']],
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// get api
exports.getdata = async (req, res, next) => {
  try {
    const dealerPlanID = req.params.id;
    const Data = await DealerPlan.findOne({
      where: {
        dealerPlanID: dealerPlanID,
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
// edit api

exports.editdata = async (req, res, next) => {
  try {
    let { planName, Description, numberOfEmployee, numberOfCompany, features } =
      await req.body;

    const currentdata = await DealerPlan.findOne({
      where: {
        dealerPlanID: req.params.id,
      },
    });

    if (!currentdata)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.deletedrecord,
      });

    const dealer = await DealerPlan.findOne({
      where: {
        planName,
        dealerPlanID: {
          [Sequelize.Op.ne]: req.params.id,
        },
      },
    });

    if (dealer) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('DealerPlan'),
      });
    }

    currentdata.planName = planName;
    currentdata.Description = Description;
    currentdata.numberOfCompany = numberOfCompany;
    currentdata.numberOfEmployee = numberOfEmployee;
    currentdata.features = features;

    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('DealerPlan'),
    });
  } catch (error) {
    next(error);
  }
};

// // delete api
exports.deletedata = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await DealerPlan.findByPk(id);

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: 'DealerPlan not found!',
      });
    }

    // Perform deletion
    await findData.destroy({
      user: req.userDetails, // Assuming you have proper handling for this
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('DealerPlan'),
    });
  } catch (error) {
    next(error);
  }
};

// active,deactive user
exports.poststatuschange = async (req, res, next) => {
  try {
    let { dealerPlanID, status } = await req.body;

    await DealerPlan.update(
      {
        status,
      },
      {
        where: { dealerPlanID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('DealerPlan')
          : message.usermessage.deactiveMessage('DealerPlan'),
    });
  } catch (err) {
    next(err);
  }
};
