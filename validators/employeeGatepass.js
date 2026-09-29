const { Joi } = require('../utils/joi');

const createEmployeeGatepassSchema = Joi.object({
  description: Joi.string().required(),
  date: Joi.date().iso().required(),
  fromTime: Joi.string().required(),
  toTime: Joi.string().required(),
  status: Joi.string().required(),
  purposeFor: Joi.string(),
  userMasterID: Joi.number().required(),
  companyMasterID: Joi.number().required(),
});

const updateEmployeeGatepassSchema = Joi.object({
  description: Joi.string().required(),
  date: Joi.date().iso().required(),
  fromTime: Joi.string().required(),
  toTime: Joi.string().required(),
  status: Joi.string().required(),
  purposeFor: Joi.string(),
  userMasterID: Joi.number().required(),
  rejectionRemarks: Joi.string(),
});

const listEmployeeGatepassSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  withDeleted: Joi.boolean(),
  companyMasterID: Joi.number(),
  userMasterID: Joi.number(),
  status: Joi.string(),
  search: Joi.string(),
  sortByField: Joi.string().valid('date', 'description'),
  sortByValue: Joi.string().valid('ASC', 'DESC', 'asc', 'desc'),
  exportData: Joi.boolean(),
  exportFileType: Joi.string().valid('csv', 'xlsx'),
  startDate: Joi.date().iso(),
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'), { adjust: (val) => new Date(val) }),
});

module.exports = {
  createEmployeeGatepassSchema,
  updateEmployeeGatepassSchema,
  listEmployeeGatepassSchema,
};
