const { Joi } = require('../utils/joi');
const { GoalTypeEnum } = require('../utils/dbUtils');
const { bulkCreateKraSchema, bulkUpdateKraSchema } = require('./kra');

const createGoalSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  fromDate: Joi.date().required(),
  toDate: Joi.date().required().greater(Joi.ref('fromDate')).messages({
    'date.base': 'End date must be a valid date',
    'any.required': 'End date is required',
    'date.greater': 'End date must be greater than start date',
  }),
  companyMasterID: Joi.number().integer().required(),
});

const bulkCreateGoalKraKpiSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  type: Joi.string()
    .valid(...Object.values(GoalTypeEnum))
    .required(),
  fromDate: Joi.date().required(),
  toDate: Joi.date().required(),
  companyMasterID: Joi.number().integer().required(),
  goalSettingId: Joi.number().integer().required(),
  kra: Joi.array().items(bulkCreateKraSchema).min(1).required(),
});

const bulkUpdateGoalKraKpiSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  type: Joi.string().valid(...Object.values(GoalTypeEnum)),
  fromDate: Joi.date(),
  toDate: Joi.date().greater(Joi.ref('fromDate')).messages({
    'date.base': 'End date must be a valid date',
    'date.greater': 'End date must be greater than start date',
  }),
  companyMasterID: Joi.number().integer(),
  goalSettingId: Joi.number().integer(),
  kra: Joi.array().items(bulkUpdateKraSchema).min(1),
});

const listGoalSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  withDeleted: Joi.boolean(),
  companyMasterID: Joi.number().integer(),
  search: Joi.string(),
  sortByField: Joi.string().valid('title', 'createdAt', 'description'),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.boolean(),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
});

module.exports = {
  createGoalSchema,
  listGoalSchema,
  bulkUpdateGoalKraKpiSchema,
  bulkCreateGoalKraKpiSchema,
};
