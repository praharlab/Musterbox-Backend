const { Joi } = require('../utils/joi');

const gradeSchema = Joi.object()
  .pattern(
    Joi.string().alphanum().min(1).max(30), // Alphanumeric keys up to 30 characters
    Joi.string()
      .pattern(/^[0-9]{1,3}-[0-9]{1,3}$/)
      .message('Value should be in this format: e.g. 51-100') // Range format validation
  )
  .custom((value, helpers) => {
    const ranges = Object.values(value).map((range) =>
      range.split('-').map(Number)
    );

    // Sort ranges by start value
    ranges.sort((a, b) => a[0] - b[0]);
    // Check for overlapping or adjacent ranges
    for (let i = 0; i < ranges.length - 1; i++) {
      const [start1, end1] = ranges[i];
      const [start2, end2] = ranges[i + 1];

      if (start2 <= end1) {
        return helpers.error('any.invalid');
      }
    }

    return value;
  })
  .message('Invalid grade: values should not overlap');

const createGoalSettingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  companyMasterID: Joi.number().integer().required(),
  grade: gradeSchema.min(1).required(),
});

const updateGoalSettingSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  companyMasterID: Joi.number().integer(),
  grade: gradeSchema.min(1),
});

const listGoalSettingSchema = Joi.object({
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
  createGoalSettingSchema,
  listGoalSettingSchema,
  updateGoalSettingSchema,
};
