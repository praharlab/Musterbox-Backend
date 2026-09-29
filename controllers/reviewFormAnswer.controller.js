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
const ReviewFormAnswers = require('../models/reviewFormAnswers');
const EmployeePerformanceReview = require('../models/employeePerformanceReview');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.bulkInsertUpdateReviewFormAnswers = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    await ReviewFormAnswers.bulkCreate(req.body, {
      user: req.userDetails,
      transaction,
      updateOnDuplicate: ['text', 'rating', 'grade'],
    });
    await transaction.commit();
    return res.status(statusCodes.OK).json({
      message: usermessage.addMessage('Review form answers'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.listReviewFormAnswers = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      reviewFormQuestionCategoryId,
      reviewFormId,
      employeePerformanceReviewId,
      companyMasterId,
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
    if (companyMasterId) companyFilter.companyMasterID = companyMasterId;

    if (search)
      condition[Op.or] = [
        { text: { [Op.iLike]: `%${search}%` } },
        { rating: { [Op.iLike]: `%${search}%` } },
        { grade: { [Op.iLike]: `%${search}%` } },
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
    const reviewForm = await ReviewFormAnswers.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: EmployeePerformanceReview,
          where: employeePerformanceReviewId
            ? { id: employeePerformanceReviewId }
            : {},
        },
        {
          model: ReviewFormQuestions,
          where: reviewFormQuestionCategoryId
            ? { id: reviewFormQuestionCategoryId }
            : {},
          include: [
            {
              // separate: true, // Added this because columns name reviewFormQuestionCategoryId was being returned as reviewFormQues in response
              model: ReviewFormQuestionCategory,
              where: reviewFormId ? { id: reviewFormId } : {},
              include: [
                {
                  model: ReviewForm,
                  include: [
                    {
                      model: companyMaster,
                      where: companyFilter,
                      attributes: companyAttributes,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      nest: true,
      distinct: true,
    });

    if (exportData) {
      await generateExcel(
        reviewForm.rows.map((e) => e.toJSON()),
        'reviewForm',
        exportFileType,
        res
      );
      return;
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Review forms'),
      data: reviewForm.rows.map((e) => e.toJSON()),
      totalcount: reviewForm.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

const findReviewFormAnswerById = async (id, userDetails) => {
  const reviewFormAnswer = await ReviewFormAnswers.findByPk(id, {
    include: [
      {
        model: UserMaster,
        as: 'createdByUser',
        attributes: userAttributes,
      },
      {
        model: ReviewFormQuestions,
        include: [
          {
            // separate: true, // Added this because columns name reviewFormQuestionCategoryId was being returned as reviewFormQues in response
            model: ReviewFormQuestionCategory,
            include: [
              {
                model: ReviewForm,
                include: [
                  {
                    model: companyMaster,
                    where: {
                      companyMasterID:
                        userDetails.childCompanies.length > 0
                          ? [
                            ...userDetails.childCompanies,
                            userDetails.companyMasterId,
                          ]
                          : userDetails.companyMasterId,
                    },
                    attributes: companyAttributes,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    nest: true,
  });
  if (!reviewFormAnswer)
    throw new CustomError(
      usermessage.notFoundMessage('Review form answer'),
      statusCodes.NOT_FOUND
    );
  return reviewFormAnswer;
};

exports.getReviewFormAnswerDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewFormAnswer = await findReviewFormAnswerById(
      id,
      req.userDetails
    );

    return res.status(statusCodes.OK).json({
      data: reviewFormAnswer,
      message: usermessage.fetchMessage('Review form answer'),
    });
  } catch (err) {
    next(err);
  }
};
