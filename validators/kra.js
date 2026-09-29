const { Joi } = require('../utils/joi');
const { bulkCreateKpiSchema, bulkUpdateKpiSchema } = require('./kpi');

const createKraSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  weightage: Joi.number().precision(2).min(1).max(100).required(),
  goalMasterId: Joi.number().integer().required(),
});

const bulkCreateKraSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  weightage: Joi.number().precision(2).min(1).max(100).required(),
  kpi: Joi.array().items(bulkCreateKpiSchema).min(1).required(),
});

const bulkUpdateKraSchema = Joi.object({
  id: Joi.number(),
  delete: Joi.boolean(),
  title: Joi.string(),
  description: Joi.string(),
  weightage: Joi.number().precision(2).min(1).max(100).strict(),
  kpi: Joi.array().items(bulkUpdateKpiSchema).min(1),
});

const updateKraSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  weightage: Joi.number().precision(2).min(1).max(100),
  goalMasterId: Joi.number().integer(),
});

const listKraSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  withDeleted: Joi.boolean(),
  companyMasterID: Joi.number().integer(),
  goalMasterId: Joi.number().integer(),
  search: Joi.string(),
  sortByField: Joi.string().valid('title', 'createdAt', 'description'),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.boolean(),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
});

module.exports = {
  createKraSchema,
  listKraSchema,
  updateKraSchema,
  bulkUpdateKraSchema,
  bulkCreateKraSchema,
};
