const { Op } = require('sequelize');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const PmsPolicy = require('../models/pmsPolicy');
const { usermessage } = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');

exports.createPmsPolicy = async (req, res, next) => {
  try {
    const { goalType, companyMasterID } = req.body;

    const existingPolicy = await PmsPolicy.findOne({
      where: {
        companyMasterId: companyMasterID,
      },
    });
    if (existingPolicy) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: usermessage.alreadyExists('Policy'),
      });
    }

    const policy = await PmsPolicy.create(
      { goalType, companyMasterId: companyMasterID },
      { user: req.userDetails }
    );
    return res.status(statusCodes.OK).json({
      data: policy,
      message: usermessage.addMessage('Policy'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePmsPolicy = async (req, res, next) => {
  try {
    const existingPolicy = await PmsPolicy.findOne({
      where: { id: req.params.id },
    });

    if (!existingPolicy) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Policy'),
      });
    }
    existingPolicy.goalType = req.body.goalType;
    await existingPolicy.save({ user: req.userDetails });
    return res.status(statusCodes.OK).json({
      data: existingPolicy,
      message: usermessage.updateMessage('Policy'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listPmsPolicy = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      companyMasterID,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;
    const condition = {};
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) companyFilter.companyMasterID = companyMasterID;
    if (search)
      condition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [['createdAt', 'DESC']];
    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * pageSize;
      paginationQuery.limit = +pageSize;
    }
    const pmsPolicy = await PmsPolicy.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
        {
          model: companyMaster,
          where: companyFilter,
        },
      ],
      nest: true,
      distinct: true,
    });

    if (exportData) {
      const finalData = pmsPolicy.rows.map((pmsPolicyItem) => {
        return {
          'PMS Policy Name': pmsPolicyItem.goalType,
          'Company Name': pmsPolicyItem.companyMaster.companyName,
        };
      });

      await generateExcel(finalData, 'pmsPolicy', exportFileType, res);
      return;
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Pms policy'),
      data: pmsPolicy.rows,
      totalcount: pmsPolicy.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPmsPolicyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pmsPolicy = await PmsPolicy.findByPk(id, {
      include: [
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
        {
          model: companyMaster,
          where: {
            companyMasterID:
              req.userDetails.childCompanies.length > 0
                ? [
                  ...req.userDetails.childCompanies,
                  req.userDetails.companyMasterId,
                ]
                : req.userDetails.companyMasterId,
          },
        },
      ],
    });

    if (!pmsPolicy)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Pms Policy'),
      });

    return res.status(statusCodes.OK).json({
      data: pmsPolicy,
      message: usermessage.fetchMessage('Pms Policy Details'),
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePmsPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pmsPolicy = await PmsPolicy.findByPk(id, {
      include: [
        {
          model: companyMaster,
          where: {
            companyMasterID:
              req.userDetails.childCompanies.length > 0
                ? [
                  ...req.userDetails.childCompanies,
                  req.userDetails.companyMasterId,
                ]
                : req.userDetails.companyMasterId,
          },
        },
      ],
      nest: true,
    });
    if (!pmsPolicy)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Pms Policy'),
      });

    await pmsPolicy.destroy({ user: req.userDetails });
    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Pms Policy'),
    });
  } catch (err) {
    next(err);
  }
};
