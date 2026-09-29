const { ReviewQuestionsResponseType } = require('../utils/dbUtils');
const { Joi } = require('../utils/joi');

const createReviewFormQuestion = Joi.object({
  question: Joi.string().required(),
  description: Joi.string(),
  responseType: Joi.string()
    .valid(...Object.values(ReviewQuestionsResponseType))
    .required(),
});

const updateReviewFormQuestion = Joi.object({
  question: Joi.string(),
  description: Joi.string(),
  delete: Joi.boolean(),
  id: Joi.number(),
  responseType: Joi.string().valid(
    ...Object.values(ReviewQuestionsResponseType)
  ),
});

module.exports = {
  createReviewFormQuestion,
  updateReviewFormQuestion,
};
