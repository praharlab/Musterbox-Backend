const CompanyType = require('../models/companytypeMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const companyMaster = require('../models/companyMaster');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddCompanyType = async (req, res, next) => {
  try {
    const { companyTypename, status, createByIp } = await req.body;

    const companyTypeData = await CompanyType.create({
      companyTypename,
      status,
      createBy: req.userDetails.userMasterId,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Company Type'),
      data: companyTypeData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all city data
 */

exports.getAllCompanyType = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      sortByField = 'companyTypename',
      sortByValue = 'ASC',
    } = await req.body;
    // Pagination

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    // Filtering & Searching
    const condition = {
      status: ['0', '1'],
    };
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { companyTypename: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    // Sorting
    const order = [[sortByField, sortByValue]];

    const { rows, count } = await CompanyType.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      raw: true,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Company Type'),
      data: rows,
      totalcount: count,
      page,
      pageSize: limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.getActiveCompanyType = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      sortByField = 'companyTypename',
      sortByValue = 'ASC',
    } = await req.body;
    // Pagination

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    // Filtering & Searching
    const condition = {
      status: 1,
    };
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { companyTypename: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    // Sorting
    const order = [[sortByField, sortByValue]];

    const { rows, count } = await CompanyType.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      raw: true,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Active Company Type'),
      data: rows,
      totalcount: count,
      page,
      pageSize: limit,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with CompanyType id
 *
 * @param {id} CompanyTypeID  to fetch city name
 */

exports.getCompanyTypeId = async (req, res, next) => {
  try {
    const companyTypeData = await CompanyType.findOne({
      where: { companyTypeID: req.params.id, status: ['0', '1'] },
      raw: true,
    });

    if (!companyTypeData)
      return res
        .status(200)
        .json({
          status: 200,
          message: message.usermessage.notFoundMessage('Company Type'),
        });
    else return res.status(200).json({ status: 200, data: companyTypeData });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} CompanyTypeID  to update id
 */
exports.postUpdateCompanyType = async (req, res, next) => {
  try {
    const { companyTypeID, companyTypename, status, updateByIp } =
      await req.body;

    await CompanyType.update(
      {
        companyTypename,
        status,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { companyTypeID },
      }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: message.usermessage.updateMessage('Company Type'),
      });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} CompanyTypeID  to delete id
 */
exports.postDeleteCompanyTypeById = async (req, res, next) => {
  try {
    const { companyTypeID } = await req.body;

    const data = await companyMaster.findOne({
      where: {
        companyTypeid: companyTypeID,
        status: ['0', '1'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.companyTypeInUse,
      });
    } else {
      await CompanyType.update(
        {
          status: '2',
        },
        {
          where: { companyTypeID },
        }
      );

      return res
        .status(200)
        .json({
          status: 200,
          message: message.usermessage.deleteMessage('Company Type'),
        });
    }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    const { companyTypeID, status } = await req.body;

    if (status != '1') {
      const data = await companyMaster.findOne({
        where: {
          companyTypeid: companyTypeID,
          status: ['0', '1'],
        },
      });
      if (data) {
        return res.status(200).json({
          status: 401,
          message: message.usermessage.companyTypeInUse,
        });
      }
    }

    await CompanyType.update(
      {
        status,
      },
      {
        where: { companyTypeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Company Type')
          : message.usermessage.deactiveMessage('Company Type'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
