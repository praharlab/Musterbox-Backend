const { Op } = require('sequelize');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const { usermessage } = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const ReviewForm = require('../models/reviewForm');
const { generateExcel } = require('../utils/exportData');
const { CustomError } = require('../utils/customError');
const PerformanceReview = require('../models/performanceReview');
const EmployeePerformanceReview = require('../models/employeePerformanceReview');
const { findPerformanceReviewById } = require('./performanceReview.controller');
const ReviewFormQuestionCategory = require('../models/reviewFormQuestionCategory');
const ReviewFormQuestions = require('../models/reviewFormQuestions');
const ReviewFormAnswers = require('../models/reviewFormAnswers');
const { employeeDesignation } = require('../utils/commonUtilFunctions');
const { generatePDF } = require('../utils/pdfGenerate');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

const findValidReviewersAndReviewees = async (userId, userDetails, type) => {
  const userExists = await UserMaster.findOne({
    where: {
      userMasterID: userId,
      companyMasterId:
        userDetails.childCompanies.length > 0
          ? [...userDetails.childCompanies, userDetails.companyMasterId]
          : userDetails.companyMasterId,
    },
    attributes: userAttributes,
  });
  if (!userExists)
    throw new CustomError(
      usermessage.notFoundMessage(type),
      statusCodes.NOT_FOUND
    );
  return userExists;
};

const findEmployeeReviewFormById = async (id, userDetails, reviewerId) => {
  const employeePerformanceReviewExists =
    await EmployeePerformanceReview.findByPk(id, {
      include: [
        {
          model: PerformanceReview,
          where: {
            companyMasterId:
              userDetails.childCompanies.length > 0
                ? [...userDetails.childCompanies, userDetails.companyMasterId]
                : userDetails.companyMasterId,
          },
          //TODO: add where condition in reviewform answer to only pull answers of selected reviewer
          include: [
            {
              model: ReviewForm,
              include: [
                {
                  model: ReviewFormQuestionCategory,
                  include: [
                    {
                      model: ReviewFormQuestions,
                      separate: true,
                      include: [
                        {
                          model: ReviewFormAnswers,
                          separate: true,
                          where: { employeePerformanceReviewId: id },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'reviewer',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'reviewee',
          attributes: userAttributes,
        },
      ],
    });
  if (!employeePerformanceReviewExists)
    throw new CustomError(
      usermessage.notFoundMessage('Employee Performance Review'),
      statusCodes.NOT_FOUND
    );
  return employeePerformanceReviewExists;
};

exports.createEmployeePerformanceReview = async (req, res, next) => {
  try {
    const { performanceReviewId, reviewerRevieweeData } = req.body;
    await findPerformanceReviewById(performanceReviewId, req.userDetails);
    
    const dataToInsert = reviewerRevieweeData.flatMap((obj) => {
      return obj.reviewees.flatMap((revieweeId) => {
        return obj.reviewers.map((reviewerId) => ({
          revieweeId,
          reviewerId,
          performanceReviewId,
          notes: obj.notes,
        }));
      });
    });

    await EmployeePerformanceReview.bulkCreate(dataToInsert, {
      individualHooks: true,
      user: req.userDetails,
    });
    return res.status(statusCodes.OK).json({
      message: usermessage.addMessage('Employee Performance Review'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateEmployeePerformanceReview = async (req, res, next) => {
  try {
    const { notes, reviewerId, revieweeId, performanceReviewId, isCompleted } =
      req.body;
    const employeePerformanceReviewExists = await findEmployeeReviewFormById(
      req.params.id,
      req.userDetails
    );
    if (notes) employeePerformanceReviewExists.notes = notes;
    if (isCompleted) employeePerformanceReviewExists.isCompleted = isCompleted;
    if (reviewerId) {
      await findValidReviewersAndReviewees(
        reviewerId,
        req.userDetails,
        'Reviewer'
      );
      employeePerformanceReviewExists.reviewerId = reviewerId;
    }
    if (revieweeId) {
      await findValidReviewersAndReviewees(
        revieweeId,
        req.userDetails,
        'Reviewee'
      );
      employeePerformanceReviewExists.revieweeId = revieweeId;
    }
    if (performanceReviewId) {
      await findPerformanceReviewById(performanceReviewId, req.userDetails);
      employeePerformanceReviewExists.performanceReviewId = performanceReviewId;
    }
    await employeePerformanceReviewExists.save({ user: req.userDetails });
    return res.status(statusCodes.OK).json({
      message: usermessage.updateMessage('Employee Performance Review'),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployeePerformanceReview = async (req, res, next) => {
  try {
    const { revieweeId, reviewerId, id } = req.query;
    const condition = {};
    if (revieweeId) condition.revieweeId = revieweeId;
    if (reviewerId) condition.reviewerId = reviewerId;
    if (id) condition.id = id;

    const employeePerformanceReviewExists =
      await EmployeePerformanceReview.findAll({
        where: condition,
        include: [
          {
            model: PerformanceReview,
            where: {
              companyMasterId:
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
    if (!employeePerformanceReviewExists.length)
      throw new CustomError(
        usermessage.notFoundMessage('Employee Review Form'),
        statusCodes.NOT_FOUND
      );
    const ids = employeePerformanceReviewExists.map((rec) => rec.id);
    await EmployeePerformanceReview.destroy(
      {
        where: { id: ids },
        individualHooks: true,
        user: req.userDetails
      }
    )
    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Employee Review Form')
    });

  } catch (error) {
    console.log(error, 'error')
    next(error);
  }
};

exports.getEmployeePerformanceReviewDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employeePerformanceReview = await findEmployeeReviewFormById(
      id,
      req.userDetails
    );

    return res.status(statusCodes.OK).json({
      data: employeePerformanceReview,
      message: usermessage.fetchMessage('Employee Performance Review'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listEmployeePerformanceReview = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      companyMasterID,
      performanceReviewId,
      revieweeId,
      userMasterID,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;
    const condition = {};
    const companyFilter = {
      companyMasterId:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      companyFilter.companyMasterId = companyMasterID;
    }
    if (performanceReviewId)
      condition.performanceReviewId = performanceReviewId;

    if (revieweeId) condition.revieweeId = revieweeId;

    if (userMasterID) condition.reviewerId = userMasterID;

    if (search) condition[Op.or] = [{ notes: { [Op.iLike]: `%${search}%` } }];
    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [['createdAt', 'DESC']];
    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * pageSize;
      paginationQuery.limit = +pageSize;
    }
    const employeePerformanceReview =
      await EmployeePerformanceReview.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        paranoid: withDeleted !== 'true',
        include: [
          {
            model: UserMaster,
            as: 'createdByUser',
            attributes: ['displayName'],
          },
          {
            model: UserMaster,
            as: 'reviewer',
            attributes: userAttributes,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: UserMaster,
            as: 'reviewee',
            attributes: userAttributes,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: PerformanceReview,
            where: companyFilter,
            include: [
              {
                model: ReviewForm,
                attributes: ['id', 'title'],
              },
            ],
          },
        ],
        nest: true,
        distinct: true,
      });

    if (exportData) {
      employeePerformanceReview.rows.map((data) => {
        delete data.dataValues.id
        delete data.dataValues.revieweeId
        delete data.dataValues.reviewerId
        delete data.dataValues.deleteBy
        delete data.dataValues.createBy
        delete data.dataValues.updateBy
        delete data.dataValues.performanceReviewId
        delete data.dataValues.reviewer.dataValues.userMasterID
        delete data.dataValues.reviewer.dataValues.companyMasterId
        delete data.dataValues.reviewee.dataValues.userMasterID
        delete data.dataValues.reviewee.dataValues.companyMasterId
        delete data.dataValues.performanceReview.dataValues.id
        delete data.dataValues.performanceReview.dataValues.createBy
        delete data.dataValues.performanceReview.dataValues.updateBy
        delete data.dataValues.performanceReview.dataValues.deleteBy
        delete data.dataValues.performanceReview.dataValues.companyMasterId
        delete data.dataValues.performanceReview.dataValues.reviewFormId
        delete data.dataValues.performanceReview.dataValues.reviewForm.dataValues.id
      })
      await generateExcel(
        employeePerformanceReview.rows.map((e) => e.toJSON()),
        'employeePerformanceReview',
        exportFileType,
        res
      );
      return;
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Employee Performance Review'),
      data: employeePerformanceReview.rows.map((e) => e.toJSON()),
      totalcount: employeePerformanceReview.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.generateEmployeePerformanceReviewReport = async (req, res, next) => {
  try {
    const { companyMasterID, performanceReviewId, revieweeId, userMasterID } =
      req.query;

    const condition = {};
    const companyFilter = {
      companyMasterId:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      companyFilter.companyMasterId = companyMasterID;
    }
    if (performanceReviewId)
      condition.performanceReviewId = performanceReviewId;

    if (revieweeId) condition.revieweeId = revieweeId;

    if (userMasterID) condition.reviewerId = userMasterID;

    const employeePerformanceReview = await EmployeePerformanceReview.findAll({
      where: condition,
      include: [
        {
          model: UserMaster,
          as: 'reviewee',
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: PerformanceReview,
          where: companyFilter,
          include: [
            {
              model: ReviewForm,
              include: [
                {
                  model: ReviewFormQuestionCategory,
                  separate: true,
                  include: [
                    {
                      model: ReviewFormQuestions,
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

    const uniqueReviewFormIds = new Set();
    const uniqueReviewForms = [];

    if (!employeePerformanceReview.length)
      return res
        .status(statusCodes.OK)
        .json({
          status: statusCodes.NOT_FOUND,
          message: usermessage.notFoundMessage('Employee Performance Review'),
        });

    employeePerformanceReview.forEach((item) => {
      const reviewFormId = item.toJSON().performanceReview.reviewForm.id;

      if (!uniqueReviewFormIds.has(reviewFormId)) {
        uniqueReviewFormIds.add(reviewFormId);
        uniqueReviewForms.push(item.toJSON().performanceReview.reviewForm);
      }
    });

    const employeePerformanceReviewIds = employeePerformanceReview.map(
      (e) => e.toJSON().id
    );
    const reviewFormAnswers = await ReviewFormAnswers.findAll({
      where: { employeePerformanceReviewId: employeePerformanceReviewIds },
      nest: true,
      distinct: true,
    });

    let reviewTable = `<tr>
    <td>Question Category</td>
    <td>Questions</td>`;

    for (let i = 0; i < employeePerformanceReview.length; i++) {
      reviewTable += `<td>Anonymous reviewer ${i + 1}</td>`;
    }
    reviewTable += `</tr>`;

    uniqueReviewForms.forEach((form) => {
      if (form.reviewFormQuestionCategories.length) {
        form.reviewFormQuestionCategories.forEach((category) => {
          if (category.reviewFormQuestions.length) {
            category.reviewFormQuestions.forEach((question) => {
              reviewTable += `<tr><td>${category.title}</td>
              <td>${question.question}</td>`;

              employeePerformanceReview.map((e) => {
                const data = e.toJSON();
                if (
                  data.performanceReview.reviewForm.reviewFormQuestionCategories
                    .length
                ) {
                  data.performanceReview.reviewForm.reviewFormQuestionCategories.forEach(
                    (category) => {
                      if (category.reviewFormQuestions.length) {
                        category.reviewFormQuestions.forEach((question) => {
                          if (reviewFormAnswers.length) {
                            reviewFormAnswers.forEach((e) => {
                              const answer = e.toJSON();
                              if (
                                answer.employeePerformanceReviewId ===
                                  data.id &&
                                answer.createBy === data.reviewerId &&
                                answer.reviewFormQuestionId === question.id
                              ) {
                                let combinedAnswer = '';
                                if (answer.rating)
                                  combinedAnswer += `<b>Rating</b>: ${answer.rating}<br>`;
                                if (answer.grade)
                                  combinedAnswer += `<b>Grade</b>: ${answer.grade}<br>`;
                                if (answer.text)
                                  combinedAnswer += `<b>Remarks</b>: ${answer.text}<br>`;
                                reviewTable += `<td>${combinedAnswer}</td>`;
                              }
                            });
                          }
                        });
                      }
                    }
                  );
                }
              });
            });
            reviewTable += `</tr>`;
          }
        });
      }
    });

    let revieweeTable = `<tr>
    <td>Employee Name</td>
    <td>Email</td>
    <td>Phone</td>
    <td>Designation</td>
    </tr>`;
    const revieweeData = employeePerformanceReview[0].toJSON().reviewee;
    const revieweeDesignation = await employeeDesignation(
      revieweeData.userMasterID,
      new Date().toISOString().slice(0, 10)
    );

    revieweeTable += `<tr>
    <td>${revieweeData.displayName}</td>
    <td>${revieweeData.email}</td>
    <td>${revieweeData.userNumber}</td>
    <td>${revieweeDesignation?.designation?.designationName ? revieweeDesignation?.designation?.designationName : '-'}</td></tr>`;

    const pdfGenerationObject = { revieweeTable, reviewTable };
    const pdfBuffer = await generatePDF(
      'performanceReviewReport',
      pdfGenerationObject
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Performance-Review-Report-${revieweeData.displayName}.pdf`
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
