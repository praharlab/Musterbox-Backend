const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const companyMasters = require('../models/companyMaster');
const config = require('../config/erpdatabase');
const sql = require('mssql');
const erpIntegration = require('../models/erpIntegration');
const axios = require('axios');
const { usermessage } = require('../response_message/message');

exports.postadd = async (req, res, next) => {
  try {
    const {
      erpName,
      baseUrl,
      companyMasterID,
      apiSecret,
      apiKey,
      empCodeUrl,
      advanceExpenceUrl,
      expenseUrl,
      expenseHeadUrl,
      salarySyncUrl,
    } = await req.body;

    const ErpIntegration = await erpIntegration.findOne({
      where: {
        companyMasterID,
        erpName,
      },
    });

    if (ErpIntegration) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('ERP Integration'),
      });
    }

    await erpIntegration.create(
      {
        erpName,
        baseUrl,
        advanceExpenceUrl,
        companyMasterID,
        apiSecret,
        apiKey,
        empCodeUrl,
        expenseUrl,
        expenseHeadUrl,
        salarySyncUrl,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.createByIp,
      },
      { user: req.userDetails }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('ERP Integration'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listdata = async (req, res, next) => {
  try {
    let { page, limit, searchQuery, companyMasterID } = await req.body;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    const paginationQuery =
      page && limit ? { offset: (page - 1) * limit, limit } : {};
    {
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { erpName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await erpIntegration.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [{ model: companyMasters, attributes: ['companyName'] }],
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

exports.editdata = async (req, res, next) => {
  try {
    const {
      erpName,
      baseUrl,
      apiSecret,
      apiKey,
      empCodeUrl,
      companyMasterID,
      advanceExpenceUrl,
      expenseUrl,
      expenseHeadUrl,
      salarySyncUrl,
    } = req.body;

    const currentdata = await erpIntegration.findOne({
      where: {
        erpIntegrationID: req.params.id,
      },
    });

    if (!currentdata) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.deletedrecord,
      });
    }

    const ErpIntegration = await erpIntegration.findOne({
      where: {
        companyMasterID,
        erpName,
        erpIntegrationID: {
          [Sequelize.Op.ne]: req.params.id,
        },
      },
    });

    if (ErpIntegration) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('ERP Integration'),
      });
    }
    currentdata.companyMasterID = companyMasterID;
    currentdata.erpName = erpName;
    currentdata.baseUrl = baseUrl;
    currentdata.apiSecret = apiSecret;
    currentdata.apiKey = apiKey;
    currentdata.empCodeUrl = empCodeUrl;
    currentdata.advanceExpenceUrl = advanceExpenceUrl;
    currentdata.expenseUrl = expenseUrl;
    currentdata.expenseHeadUrl = expenseHeadUrl;
    currentdata.salarySyncUrl = salarySyncUrl;

    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('ERP Integration'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const erpIntegrationID = req.params.id;

    const data = await erpIntegration.findOne({
      where: {
        erpIntegrationID: erpIntegrationID,
      },
    });

    if (!data) {
      return res.status(404).json({
        status: 404,
        message: 'Data not found',
      });
    }

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletebyid = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await erpIntegration.findOne({
      where: {
        erpIntegrationID: id,
      },
    });

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: 'ERP Integration not found!',
      });
    }

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('ERP Integration'),
    });
  } catch (err) {
    next(err);
  }
};

exports.erpHeadName = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;

    const records = await erpIntegration.findOne({
      where: { companyMasterID },
      attributes: ['apiKey', 'apiSecret', 'expenseHeadUrl'],
    });

    if (!records) {
      return res.status(200).json({
        status: 404,
        message: usermessage.notFoundMessage('ErpIntegration'),
      });
    } else if (!records.expenseHeadUrl) {
      return res.status(200).json({
        status: 404,
        message: usermessage.notFoundMessage('ExpenseHead Url'),
      });
    }

    const apiKey = `${records.apiKey}`;
    const apiSecret = `${records.apiSecret}`;

    // Create the base64 encoded string
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    // Set up the Authorization header
    const headers = {
      Authorization: `Basic ${auth}`,
    };

    const apiUrl = `${records.expenseHeadUrl}`;

    const response = await axios.get(apiUrl, { headers });

    if (!response) {
      return res.status(200).json({
        status: 404,
        message: 'Error In Erp API',
      });
    }

    const names = response.data.message.message.map((item) => item.name);
    return res.status(200).json({
      status: 200,
      data: names,
      message: 'Data Fetched Successfully',
    });
  } catch (err) {
    next(err);
  }
};
