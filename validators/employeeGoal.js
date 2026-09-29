const { Joi } = require('../utils/joi');
const {
  EmployeeGoalStatusEnum,
  GoalEvaluationPeriodEnum,
} = require('../utils/dbUtils');

const bulkCreateEmployeeGoalSchema = Joi.object({
  goalMasterId: Joi.number().required(),
  bulkData: Joi.array()
    .items(
      Joi.object({
        userMasterID: Joi.array().items(Joi.number()).min(1),
        remarks: Joi.string(),
        targetGiven: Joi.number(),
        evaluationPeriod: Joi.string().valid(
          ...Object.values(GoalEvaluationPeriodEnum)
        ),
        status: Joi.string().valid(...Object.values(EmployeeGoalStatusEnum)),
      })
    )
    .required(),
});

const updateEmployeeGoalSchema = Joi.object({
  targetGiven: Joi.number(),
  targetAchieved: Joi.number(),
  goalMasterId: Joi.number(),
  userMasterID: Joi.number(),
  remarks: Joi.string(),
  status: Joi.string().valid(...Object.values(EmployeeGoalStatusEnum)),
});

const listEmployeeGoalsSchema = Joi.object({
  page: Joi.number(),
  pageSize: Joi.number(),
  withDeleted: Joi.boolean(),
  status: Joi.string().valid(...Object.values(EmployeeGoalStatusEnum)),
  userMasterID: Joi.number(),
  goalMasterId: Joi.number(),
  companyMasterID: Joi.number(),
  sortByField: Joi.string(),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.string().valid('true', 'false'),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
  search: Joi.string(),
});

module.exports = {
  bulkCreateEmployeeGoalSchema,
  listEmployeeGoalsSchema,
  updateEmployeeGoalSchema,
};
