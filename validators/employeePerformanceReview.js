const { Joi } = require('../utils/joi');

const createEmployeePerformanceReview = Joi.object({
  performanceReviewId: Joi.number().required(),
  reviewerRevieweeData: Joi.array().items(
    Joi.object({
      reviewees: Joi.array().items(Joi.number()).required(),
      reviewers: Joi.array().items(Joi.number()).required(),
      notes: Joi.string(),
    })
  ),
});

const updateEmployeePerformanceReview = Joi.object({
  notes: Joi.string(),
  revieweeId: Joi.number(),
  reviewerId: Joi.number(),
  performanceReviewId: Joi.number(),
  isCompleted: Joi.boolean(),
});

const deleteEmployeePerformanceReview = Joi.object({
  revieweeId: Joi.number(),
  userMasterID: Joi.number(),
  id: Joi.number(),
})
  .min(1)
  .max(1);

const listEmployeePerformanceReview = Joi.object({
  page: Joi.number(),
  pageSize: Joi.number(),
  withDeleted: Joi.boolean(),
  companyMasterID: Joi.number(),
  performanceReviewId: Joi.number(),
  userMasterID: Joi.number(),
  revieweeId: Joi.number(),
  sortByField: Joi.string(),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.string().valid('true', 'false'),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
  search: Joi.string(),
});

module.exports = {
  createEmployeePerformanceReview,
  updateEmployeePerformanceReview,
  listEmployeePerformanceReview,
  deleteEmployeePerformanceReview,
};
