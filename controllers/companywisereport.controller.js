const Sequelize = require('sequelize');
const CompanywiseReport = require('../models/companywiseReport');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const { executeQuery } = require('./common.controller');
const { companyAttributes } = require('../utils/commonVars');

exports.postAddCompanywiseReport = async (req, res, next) => {
  try {
    let { functionName, displayName, params, companyMasterID } = await req.body;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    await CompanywiseReport.create({
      functionName,
      displayName,
      params,
      companyMasterID,
      createBy,
      createByIp,
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Companywise Report'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllCompanywiseReportData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    const condition = {
      status: ['0', '1'],
    };
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { functionName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const { rows: companywiseReportData, count } =
      await CompanywiseReport.findAndCountAll({
        raw: true,
        where: condition,
        ...paginationQuery,
        order: [['companywiseReportID', 'ASC']],
        include: [
          {
            model: companyMasters,
            attributes: companyAttributes,
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: companywiseReportData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCompanywiseReportById = async (req, res, next) => {
  try {
    let get_one_data = await CompanywiseReport.findOne({
      where: {
        companywiseReportID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateCompanywiseReport = async (req, res, next) => {
  try {
    let {
      companywiseReportID,
      functionName,
      displayName,
      params,
      companyMasterID,
    } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await CompanywiseReport.update(
      {
        functionName,
        displayName,
        params,
        companyMasterID,
        updateBy,
        updateByIp,
      },
      {
        where: { companywiseReportID: companywiseReportID },
      }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Companywise Report'),
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { companywiseReportID, status } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await CompanywiseReport.update(
      {
        status,
        updateBy,
        updateByIp,
      },
      {
        where: {
          companywiseReportID: companywiseReportID,
          status: ['1', '0'],
        },
      }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Companywise Report'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteCompanywiseReportById = async (req, res, next) => {
  try {
    let { companywiseReportID } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await CompanywiseReport.update(
      {
        status: 2,
        updateBy,
        updateByIp,
      },
      {
        where: { companywiseReportID: companywiseReportID },
      }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Companywise Report'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getCompanywiseReportByCompanyId = async (req, res, next) => {
  try {
    let companydata = await companyMasters.findOne({
      where: {
        companyMasterID: req.params.id,
      },
    });
    let companyid;
    if (companydata.parentCompanyMasterID == '0') {
      companyid = companydata.companyMasterID;
    } else {
      companyid = Number(companydata.parentCompanyMasterID);
    }

    let get_one_data = await CompanywiseReport.findAll({
      where: {
        companyMasterID: companyid,
        status: 1,
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getdataofreport = async (req, res, next) => {
  try {
    let { functionName, params } = await req.body;
    let name;
    if (params.length > 0) {
      params = params.join();

      name = functionName + '(' + params + ')';
    } else {
      name = functionName + '()';
    }
    let result = await executeQuery('SELECT * from public.' + name);
    res.status(200).json({
      status: 200,
      message: 'SELECT * from public.' + name,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
