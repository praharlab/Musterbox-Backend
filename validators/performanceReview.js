const { PerformanceReviewStatus } = require('../utils/dbUtils');
const { Joi } = require('../utils/joi');

const createPerformanceReview = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  status: Joi.string().valid(...Object.values(PerformanceReviewStatus)),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  companyMasterID: Joi.number().required(),
  reviewFormId: Joi.number().required(),
});

const updatePerformanceReview = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  status: Joi.string().valid(...Object.values(PerformanceReviewStatus)),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  companyMasterID: Joi.number(),
  reviewFormId: Joi.number(),
});

const listPerformanceReview = Joi.object({
  page: Joi.number(),
  pageSize: Joi.number(),
  withDeleted: Joi.boolean(),
  status: Joi.string().valid(...Object.values(PerformanceReviewStatus)),
  companyMasterID: Joi.number(),
  reviewFormId: Joi.number(),
  sortByField: Joi.string(),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.string().valid('true', 'false'),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
  search: Joi.string(),
});

module.exports = {
  createPerformanceReview,
  listPerformanceReview,
  updatePerformanceReview,
};
