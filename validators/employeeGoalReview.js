const { Joi } = require('../utils/joi');

const bulkCreateEmployeeGoalReviewSchema = Joi.object({
  employeeGoalId: Joi.number().required(),
  userMasterID: Joi.array().items(Joi.number()).min(1).required(),
});

const updateEmployeeGoalReviewSchema = Joi.object({
  employeeGoalId: Joi.number().required(),
  bulkData: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().required(), // id of employeeGoalReview
        kpiMasterId: Joi.number().required(),
        remarks: Joi.string(),
        targetAchieved: Joi.number(),
        reviewerId: Joi.number(),
      })
    )
    .min(1),
});

const listEmployeeGoalReviewsSchema = Joi.object({
  page: Joi.number(),
  pageSize: Joi.number(),
  withDeleted: Joi.boolean(),
  userMasterID: Joi.number(),
  revieweeId: Joi.number(),
  kpiMasterId: Joi.number(),
  goalMasterId: Joi.number(),
  companyMasterID: Joi.number(),
  sortByField: Joi.string(),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.string().valid('true', 'false'),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
  search: Joi.string(),
});

const addReviewSchema = Joi.object({
  employeeGoalReviewId: Joi.number().required(),
  kpiData: Joi.array()
    .items(
      Joi.object({
        kpiMasterId: Joi.number().required(),
        targetAchieved: Joi.number().required(),
        remarks: Joi.string(),
      })
    )
    .min(1),
});

module.exports = {
  bulkCreateEmployeeGoalReviewSchema,
  listEmployeeGoalReviewsSchema,
  updateEmployeeGoalReviewSchema,
  addReviewSchema,
};
