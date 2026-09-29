const { Joi } = require('../utils/joi');
const { PmsPolicyEnum } = require('../utils/dbUtils');

const createPmsPolicySchema = Joi.object({
  companyMasterID: Joi.number().required(),
  goalType: Joi.string()
    .valid(...Object.values(PmsPolicyEnum))
    .required(),
});

const updatePmsPolicySchema = Joi.object({
  companyMasterID: Joi.number(),
  goalType: Joi.string().valid(...Object.values(PmsPolicyEnum)),
});

const listPmsPolicySchema = Joi.object({
  page: Joi.number(),
  pageSize: Joi.number(),
  withDeleted: Joi.boolean(),
  goalType: Joi.string().valid(...Object.values(PmsPolicyEnum)),
  companyMasterID: Joi.number(),
  sortByField: Joi.string(),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.string().valid('true', 'false'),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
  search: Joi.string(),
});

module.exports = {
  createPmsPolicySchema,
  updatePmsPolicySchema,
  listPmsPolicySchema,
};
