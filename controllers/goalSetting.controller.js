const { Op } = require('sequelize');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');
const { usermessage } = require('../response_message/message');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const GoalSetting = require('../models/goalSetting');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.createGoalSetting = async (req, res, next) => {
  try {
    const { title, description, grade, companyMasterID } = req.body;

    const goalSetting = await GoalSetting.create(
      { title, description, grade, companyMasterId: companyMasterID },
      { user: req.userDetails }
    );
    return res.status(statusCodes.OK).json({
      data: goalSetting,
      message: usermessage.addMessage('Goal Setting'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateGoalSetting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, title, companyMasterID, grade } = req.body;
    const goalSetting = await GoalSetting.findByPk(id);
    if (!goalSetting) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Goal Setting'),
      });
    }

    if (title) goalSetting.title = title;
    if (grade) goalSetting.grade = grade;
    if (description) goalSetting.description = description;
    if (companyMasterID) goalSetting.companyMasterId = companyMasterID;
    await goalSetting.save({ user: req.userDetails });
    return res.status(statusCodes.OK).json({
      data: goalSetting,
      message: usermessage.updateMessage('Goal Setting'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getGoalSettingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const goalSetting = await GoalSetting.findByPk(id, {
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

    if (!goalSetting)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Goal Setting'),
      });

    return res.status(statusCodes.OK).json({
      data: goalSetting,
      message: usermessage.fetchMessage('Goal Setting Details'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listGoalSetting = async (req, res, next) => {
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
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;

      companyFilter.companyMasterID = companyMasterID;
    }
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
    const goalSetting = await GoalSetting.findAndCountAll({
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
      const finalData = goalSetting.rows.map((goalSettingItem) => {
        return {
          'Goal Setting Name': goalSettingItem.title,
          Description: goalSettingItem.description,
          'Company Name': goalSettingItem.companyMaster.companyName,
        };
      });

      await generateExcel(finalData, 'goalSetting', exportFileType, res);
      return;
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Goal Settings'),
      data: goalSetting.rows,
      totalcount: goalSetting.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteGoalSetting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const goalSetting = await GoalSetting.findByPk(id, {
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
    if (!goalSetting)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Goal Setting'),
      });

    await goalSetting.destroy({ user: req.userDetails });
    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Goal Setting'),
    });
  } catch (err) {
    next(err);
  }
};
