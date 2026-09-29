const { Joi } = require('../utils/joi');

const createKpiSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  weightage: Joi.number().precision(2).min(1).max(100).required(),
  kraMasterId: Joi.number().integer().required(),
  targetGiven: Joi.number().precision(2).min(1).max(100).required(),
});

const bulkCreateKpiSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  weightage: Joi.number().precision(2).min(1).max(100).required(),
  targetGiven: Joi.number().precision(2).min(1).max(100).required(),
});

const bulkUpdateKpiSchema = Joi.object({
  id: Joi.number(),
  delete: Joi.boolean(),
  title: Joi.string(),
  description: Joi.string(),
  weightage: Joi.number().precision(2).min(1).max(100),
  targetGiven: Joi.number().precision(2).min(1).max(100),
});

const updateKpiSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  weightage: Joi.number().precision(2).min(1).max(100),
  kraMasterId: Joi.number().integer(),
  targetGiven: Joi.number().precision(2).min(1).max(100),
});

const listKpiSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  withDeleted: Joi.boolean(),
  companyMasterID: Joi.number().integer(),
  kraMasterId: Joi.number().integer(),
  search: Joi.string(),
  sortByField: Joi.string().valid('title', 'createdAt', 'description'),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.boolean(),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
});

module.exports = {
  createKpiSchema,
  listKpiSchema,
  updateKpiSchema,
  bulkCreateKpiSchema,
  bulkUpdateKpiSchema,
};
