const express = require('express');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const employeeGoalController = require('../controllers/employeeGoal.controller');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  bulkCreateEmployeeGoalSchema,
  listEmployeeGoalsSchema,
  updateEmployeeGoalSchema,
} = require('../validators/employeeGoal');

const router = express.Router();
router.post(
  '/v1',
  validateSchema(bulkCreateEmployeeGoalSchema, reqObjectType.BODY),
  verifyChildParent,
  employeeGoalController.bulkCreateEmployeeGoal
);
router.put(
  '/v1/:id',
  validateSchema(updateEmployeeGoalSchema),
  verifyChildParent,
  employeeGoalController.updateEmployeeGoal
);
router.get(
  '/v1/:id',
  verifyChildParent,
  employeeGoalController.getEmployeeGoalDetails
);
router.get(
  '/v1',
  validateSchema(listEmployeeGoalsSchema, reqObjectType.QUERY),
  verifyChildParent,
  employeeGoalController.listEmployeeGoals
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  employeeGoalController.deleteEmployeeGoal
);

module.exports = router;
