const { Joi } = require('../utils/joi');
const {
  createReviewFormQuestionCategory,
  updateReviewFormQuestionCategory,
} = require('./reviewFormQuestionCategory');

const createReviewForm = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  companyMasterID: Joi.number().required(),
  reviewFormQuestionCategory: Joi.array()
    .items(createReviewFormQuestionCategory)
    .min(1),
});

const updateReviewForm = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  companyMasterID: Joi.number(),
  reviewFormQuestionCategory: Joi.array().items(
    updateReviewFormQuestionCategory
  ),
});

const listReviewForm = Joi.object({
  page: Joi.number(),
  pageSize: Joi.number(),
  withDeleted: Joi.boolean(),
  companyMasterID: Joi.number(),
  sortByField: Joi.string(),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.string().valid('true', 'false'),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
  search: Joi.string(),
});

module.exports = {
  createReviewForm,
  listReviewForm,
  updateReviewForm,
};
