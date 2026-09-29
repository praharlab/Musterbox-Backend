const { Op } = require('sequelize');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const { usermessage } = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const ReviewForm = require('../models/reviewForm');
const ReviewFormQuestionCategory = require('../models/reviewFormQuestionCategory');
const ReviewFormQuestions = require('../models/reviewFormQuestions');
const { generateExcel } = require('../utils/exportData');
const sequelize = require('../config/database');
const { CustomError } = require('../utils/customError');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.bulkCreateReviewForm = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { title, description, reviewFormQuestionCategory, companyMasterID } =
      req.body;
    const reviewForm = await ReviewForm.create(
      {
        title,
        description,
        companyMasterId: companyMasterID,
      },
      {
        user: req.userDetails,
        transaction,
      }
    );
    const reviewFormId = reviewForm.toJSON().id;
    for (const element of reviewFormQuestionCategory) {
      const { reviewFormQuestions, ...reviewFormQuestionCategoryData } =
        element;

      const createdReviewFormQuestionCategory =
        await ReviewFormQuestionCategory.create(
          { ...reviewFormQuestionCategoryData, reviewFormId },
          { user: req.userDetails, transaction }
        );
      const reviewFormQuestionCategoryId =
        createdReviewFormQuestionCategory.toJSON().id;

      const questionsToInsert = reviewFormQuestions.map((question) => ({
        ...question,
        reviewFormQuestionCategoryId,
      }));

      await ReviewFormQuestions.bulkCreate(questionsToInsert, {
        user: req.userDetails,
        transaction,
        individualHooks: true,
      });
    }
    await transaction.commit();
    return res.status(statusCodes.OK).json({
      message: usermessage.addMessage('Review Form'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.listReviewForm = async (req, res, next) => {
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
    const reviewForm = await ReviewForm.findAndCountAll({
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
          model: companyMaster,
          where: companyFilter,
        },
        {
          model: ReviewFormQuestionCategory,
          include: [
            {
              separate: true, // Added this because columns name reviewFormQuestionCategoryId was being returned as reviewFormQues in response
              model: ReviewFormQuestions,
            },
          ],
        },
      ],
      nest: true,
      distinct: true,
    });

    if (exportData) {
      reviewForm.rows.map((x) => {
        delete x.dataValues.id
        delete x.dataValues.createBy
        delete x.dataValues.updateBy
        delete x.dataValues.deleteBy
        delete x.dataValues.companyMasterId
        delete x.dataValues.createdByUser.dataValues.userMasterID
        delete x.dataValues.createdByUser.dataValues.createdBy
        delete x.dataValues.createdByUser.dataValues.companyMasterId
        delete x.dataValues.companyMaster.dataValues.cityMasterID
        delete x.dataValues.companyMaster.dataValues.companyMasterID
        delete x.dataValues.companyMaster.dataValues.parentCompanyMasterID
        delete x.dataValues.companyMaster.dataValues.companyTypeid
        delete x.dataValues.companyMaster.dataValues.createBy
        delete x.dataValues.companyMaster.dataValues.updateBy
        delete x.dataValues.companyMaster.dataValues.expenseDatePicker
        delete x.dataValues.companyMaster.dataValues.subCompanyRequired
        delete x.dataValues.companyMaster.dataValues.status
        delete x.dataValues.companyMaster.dataValues.uniqueEmpCode
        delete x.dataValues.companyMaster.dataValues.tdsdeduction
        x.dataValues.reviewFormQuestionCategories.map((y) => {
          delete y.dataValues.id
          delete y.dataValues.updateBy
          delete y.dataValues.createBy
          delete y.dataValues.reviewFormId
          y.reviewFormQuestions.map((a) => {
            delete a.dataValues.updateBy
            delete a.dataValues.reviewFormQuestionCategoryId
            delete a.dataValues.id
            delete a.dataValues.createBy
          })
        })
      })
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

const findReviewFormById = async (id, userDetails) => {
  const reviewForm = await ReviewForm.findByPk(id, {
    include: [
      {
        model: ReviewFormQuestionCategory,
        include: [{ model: ReviewFormQuestions, separate: true }],
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
      },
    ],
    nest: true,
  });
  if (!reviewForm)
    throw new CustomError(
      usermessage.notFoundMessage('Review form'),
      statusCodes.NOT_FOUND
    );
  return reviewForm;
};

exports.bulkUpdateReviewForm = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { title, description, reviewFormQuestionCategory, companyMasterId } =
      req.body;
    const { id } = req.params;

    const reviewForm = await findReviewFormById(id, req.userDetails);

    if (title) reviewForm.title = title;
    if (description) reviewForm.description = description;
    if (companyMasterId) reviewForm.companyMasterId = companyMasterId;

    await reviewForm.save({ transaction, user: req.userDetails });

    if (reviewFormQuestionCategory) {
      for (const element of reviewFormQuestionCategory) {
        const { reviewFormQuestions, ...reviewFormQuestionCategoryData } =
          element;

        if (reviewFormQuestionCategoryData.id) {
          const reviewFormQuestionCategoryExists =
            await ReviewFormQuestionCategory.findOne({
              where: {
                id: reviewFormQuestionCategoryData.id,
                reviewFormId: id,
              },
              include: [{ model: ReviewFormQuestions }],
              transaction,
            });
          if (!reviewFormQuestionCategoryExists)
            throw new CustomError(
              usermessage.notFoundMessage('Question Category'),
              statusCodes.NOT_FOUND
            );

          // Delete question category
          if (reviewFormQuestionCategoryData.delete) {
            const questionsToDelete =
              reviewFormQuestionCategoryExists.reviewFormQuestions.map(
                (question) => question.id
              );
            await reviewFormQuestionCategoryExists.destroy({
              transaction,
              user: req.userDetails,
            });
            await ReviewFormQuestions.destroy(
              { where: { id: questionsToDelete } },
              { transaction, user: req.userDetails }
            );
          }
          // Update question category
          else {
            if (title) reviewFormQuestionCategoryExists.title = title;
            if (description)
              reviewFormQuestionCategoryExists.description = description;
            await reviewFormQuestionCategoryExists.save({
              transaction,
              user: req.userDetails,
            });
            if (reviewFormQuestions) {
              for (const question of reviewFormQuestions) {
                if (question.id) {
                  const reviewFormQuestionExists =
                    await ReviewFormQuestions.findOne({
                      where: {
                        id: question.id,
                        reviewFormQuestionCategoryId:
                          reviewFormQuestionCategoryData.id,
                      },
                      transaction,
                    });
                  if (!reviewFormQuestionExists)
                    throw new CustomError(
                      usermessage.notFoundMessage('Question'),
                      statusCodes.NOT_FOUND
                    );
                  // Delete question
                  if (question.delete)
                    await reviewFormQuestionExists.destroy({
                      transaction,
                      user: req.userDetails,
                    });
                  // Update question
                  else {
                    if (question.question)
                      reviewFormQuestionExists.question = question.question;
                    if (question.responseType)
                      reviewFormQuestionExists.responseType =
                        question.responseType;
                    if (question.description)
                      reviewFormQuestionExists.description =
                        question.description;
                    await reviewFormQuestionExists.save({
                      transaction,
                      user: req.userDetails,
                    });
                  }
                }
                // Create question
                else {
                  await ReviewFormQuestions.create(
                    {
                      ...question,
                      reviewFormQuestionCategoryId:
                        reviewFormQuestionCategoryData.id,
                    },
                    { user: req.userDetails, transaction }
                  );
                }
              }
            }
          }
        }
        // Update question category
        else {
          const insertedQuestionCategory =
            await ReviewFormQuestionCategory.create(
              { ...reviewFormQuestionCategoryData, reviewFormId: id },
              { user: req.userDetails, transaction }
            );
          const questionsToInsert = reviewFormQuestions.map((question) => ({
            ...question,
            reviewFormQuestionCategoryId: insertedQuestionCategory.toJSON().id,
          }));

          await ReviewFormQuestions.bulkCreate(questionsToInsert, {
            user: req.userDetails,
            transaction,
            individualHooks: true,
          });
        }
      }
    }
    await transaction.commit();
    return res.status(statusCodes.OK).json({
      message: usermessage.updateMessage('Review Form'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getReviewFormDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewForm = await findReviewFormById(id, req.userDetails);

    return res.status(statusCodes.OK).json({
      data: reviewForm,
      message: usermessage.fetchMessage('Review form'),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteReviewForm = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const reviewForm = await findReviewFormById(id, req.userDetails);

    const categoriesToDelete = reviewForm
      .toJSON()
      .reviewFormQuestionCategories.map((category) => category.id);

    const questionsToDelete = reviewForm
      .toJSON()
      .reviewFormQuestionCategories.flatMap((category) =>
        category.reviewFormQuestions.map((question) => question.id)
      );

    await reviewForm.destroy({ transaction, user: req.userDetails });

    await ReviewFormQuestionCategory.destroy(
      { where: { id: categoriesToDelete } },
      { transaction, user: req.userDetails }
    );

    await ReviewFormQuestions.destroy(
      { where: { id: questionsToDelete } },
      { transaction, user: req.userDetails }
    );

    await transaction.commit();

    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Review form'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
