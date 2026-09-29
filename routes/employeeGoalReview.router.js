const express = require('express');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const employeeGoalReviewController = require('../controllers/employeeGoalReview.controller');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  bulkCreateEmployeeGoalReviewSchema,
  listEmployeeGoalReviewsSchema,
  updateEmployeeGoalReviewSchema,
  addReviewSchema,
} = require('../validators/employeeGoalReview');

const router = express.Router();

router.get(
  '/v1/report',
  verifyChildParent,
  employeeGoalReviewController.employeeGoalReviewReport
);

router.get(
  '/v1/designationWiseReport',
  verifyChildParent,
  employeeGoalReviewController.employeeGoalReviewReportDesignationWise
);

router.post(
  '/v1',
  validateSchema(bulkCreateEmployeeGoalReviewSchema, reqObjectType.BODY),
  verifyChildParent,
  employeeGoalReviewController.bulkCreateEmployeeGoalReview
);
router.post(
  '/v1/add-review',
  validateSchema(addReviewSchema, reqObjectType.BODY),
  verifyChildParent,
  employeeGoalReviewController.addReview
);
router.put(
  '/v1',
  validateSchema(updateEmployeeGoalReviewSchema),
  verifyChildParent,
  employeeGoalReviewController.updateEmployeeGoalReview
);
router.get(
  '/v1/:id',
  verifyChildParent,
  employeeGoalReviewController.getEmployeeGoalReviewDetails
);
router.get(
  '/v1',
  validateSchema(listEmployeeGoalReviewsSchema, reqObjectType.QUERY),
  verifyChildParent,
  employeeGoalReviewController.listEmployeeGoals
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  employeeGoalReviewController.deleteEmployeeGoalReview
);

module.exports = router;
