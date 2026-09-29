const { Joi } = require('../utils/joi');
const {
  createReviewFormQuestion,
  updateReviewFormQuestion,
} = require('./reviewFormQuestion');

const createReviewFormQuestionCategory = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  reviewFormQuestions: Joi.array().items(createReviewFormQuestion).min(1),
});

const updateReviewFormQuestionCategory = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  delete: Joi.boolean(),
  id: Joi.number(),
  reviewFormQuestions: Joi.array().items(updateReviewFormQuestion),
});

module.exports = {
  createReviewFormQuestionCategory,
  updateReviewFormQuestionCategory,
};
