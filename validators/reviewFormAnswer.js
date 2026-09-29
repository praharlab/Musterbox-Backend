const { Joi } = require('../utils/joi');

const createReviewFormAnswer = Joi.object({
  reviewFormQuestionId: Joi.number().required(),
  employeePerformanceReviewId: Joi.number().required(),
  text: Joi.string(),
  rating: Joi.number(),
  grade: Joi.string(),
}).or('text', 'rating', 'grade');

const updateReviewFormAnswer = Joi.object({
  id: Joi.number().required(),
  reviewFormQuestionId: Joi.number().required(),
  employeePerformanceReviewId: Joi.number().required(),
  text: Joi.string(),
  rating: Joi.number(),
  grade: Joi.string(),
}).or('text', 'rating', 'grade');

const bulkCreateUpdateReviewFormAnswers = Joi.array().items(
  Joi.alternatives().try(createReviewFormAnswer, updateReviewFormAnswer)
);

const listReviewFormAnswers = Joi.object({
  page: Joi.number(),
  pageSize: Joi.number(),
  withDeleted: Joi.boolean(),
  reviewFormQuestionCategoryId: Joi.number(),
  employeePerformanceReviewId: Joi.number(),
  reviewFormId: Joi.number(),
  companyMasterID: Joi.number(),
  sortByField: Joi.string(),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.string().valid('true', 'false'),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
  search: Joi.string(),
});

module.exports = {
  bulkCreateUpdateReviewFormAnswers,
  listReviewFormAnswers,
};
