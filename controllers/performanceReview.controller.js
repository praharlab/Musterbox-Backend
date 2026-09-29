const { Op } = require('sequelize');
const {
  userAttributes,
  statusCodes,
  companyAttributes,
} = require('../utils/commonVars');
const { usermessage } = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const ReviewForm = require('../models/reviewForm');
const ReviewFormQuestionCategory = require('../models/reviewFormQuestionCategory');
const ReviewFormQuestions = require('../models/reviewFormQuestions');
const { generateExcel } = require('../utils/exportData');
const sequelize = require('../config/database');
const { CustomError } = require('../utils/customError');
const PerformanceReview = require('../models/performanceReview');
const EmployeePerformanceReview = require('../models/employeePerformanceReview');

exports.findPerformanceReviewById = async (id, userDetails) => {
  const performanceReview = await PerformanceReview.findByPk(id, {
    include: [
      {
        model: ReviewForm,
        include: [
          {
            model: ReviewFormQuestionCategory,
            include: [{ model: ReviewFormQuestions, separate: true }],
          },
        ],
      },
      {
        model: UserMaster,
        as: 'createdByUser',
        attributes: userAttributes,
      },
      {
        model: companyMaster,
        where: {
          companyMasterID:
            userDetails.childCompanies.length > 0
              ? [...userDetails.childCompanies, userDetails.companyMasterId]
              : userDetails.companyMasterId,
        },
        attributes: companyAttributes,
      },
    ],
    nest: true,
  });
  if (!performanceReview)
    throw new CustomError(
      usermessage.notFoundMessage('Performance Review'),
      statusCodes.NOT_FOUND
    );
  return performanceReview;
};

exports.createPerformanceReview = async (req, res, next) => {
  try {
    const reviewFormExists = await ReviewForm.findOne({
      id: req.body.reviewFormId,
      companyMasterId:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    });
    if (!reviewFormExists)
      throw new CustomError(usermessage.notFoundMessage('Review Form'));

    req.body.companyMasterId = req.body.companyMasterID;
    await PerformanceReview.create({ ...req.body }, { user: req.userDetails });
    return res.status(statusCodes.OK).json({
      message: usermessage.addMessage('Performance Review'),
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePerformanceReview = async (req, res, next) => {
  try {
    const { reviewFormId, title, description, startDate, endDate, status } =
      req.body;
    const performanceReviewExists = await this.findPerformanceReviewById(
      req.params.id,
      req.userDetails
    );
    if (reviewFormId) {
      const reviewFormExists = await ReviewForm.findOne({
        id: req.body.reviewFormId,
        companyMasterId:
          req.userDetails.childCompanies.length > 0
            ? [
              ...req.userDetails.childCompanies,
              req.userDetails.companyMasterId,
            ]
            : req.userDetails.companyMasterId,
      });
      if (!reviewFormExists)
        throw new CustomError(usermessage.notFoundMessage('Review Form'));
      performanceReviewExists.reviewFormId = reviewFormId;
    }
    if (title) performanceReviewExists.title = title;
    if (description) performanceReviewExists.description = description;
    if (startDate) performanceReviewExists.startDate = startDate;
    if (endDate) performanceReviewExists.endDate = endDate;
    if (status) performanceReviewExists.status = status;

    await performanceReviewExists.save({ user: req.userDetails });
    return res.status(statusCodes.OK).json({
      message: usermessage.updateMessage(
        'Performance Review',
        statusCodes.NOT_FOUND
      ),
    });
  } catch (error) {
    next(error);
  }
};

exports.listPerformanceReview = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      status,
      companyMasterID,
      reviewFormId,
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
    if (status) condition.status = status;
    if (reviewFormId) condition.reviewFormId = reviewFormId;
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
    const performanceReview = await PerformanceReview.findAndCountAll({
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
          attributes: companyAttributes,
        },
        {
          model: ReviewForm,
        },
      ],
      nest: true,
      distinct: true,
    });

    if (exportData) {
      await generateExcel(
        performanceReview.rows.map((e) => e.toJSON()),
        'performanceReview',
        exportFileType,
        res
      );
      return;
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Performance Review'),
      data: performanceReview.rows.map((e) => e.toJSON()),
      totalcount: performanceReview.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPerformanceReviewDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const performanceReview = await this.findPerformanceReviewById(
      id,
      req.userDetails
    );

    return res.status(statusCodes.OK).json({
      data: performanceReview,
      message: usermessage.fetchMessage('Performance Review'),
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePerformanceReview = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const performanceReviewExists = await this.findPerformanceReviewById(
      id,
      req.userDetails
    );
    await performanceReviewExists.destroy({
      transaction,
      user: req.userDetails,
    });
    await EmployeePerformanceReview.destroy(
      { where: { performanceReviewId: id } },
      { transaction, user: req.userDetails }
    );
    await transaction.commit();
    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Performance Review'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
