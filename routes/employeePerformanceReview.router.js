const express = require('express');
const EmployeePerformanceReviewController = require('../controllers/employeePerformanceReview.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  createEmployeePerformanceReview,
  deleteEmployeePerformanceReview,
  listEmployeePerformanceReview,
  updateEmployeePerformanceReview,
} = require('../validators/employeePerformanceReview');

const router = express.Router();

router.get(
  '/v1/report',
  verifyChildParent,
  EmployeePerformanceReviewController.generateEmployeePerformanceReviewReport
);
router.post(
  '/v1',
  validateSchema(createEmployeePerformanceReview, reqObjectType.BODY),
  verifyChildParent,
  EmployeePerformanceReviewController.createEmployeePerformanceReview
);
router.put(
  '/v1/:id',
  validateSchema(updateEmployeePerformanceReview, reqObjectType.BODY),
  verifyChildParent,
  EmployeePerformanceReviewController.updateEmployeePerformanceReview
);
router.get(
  '/v1',
  validateSchema(listEmployeePerformanceReview, reqObjectType.QUERY),
  verifyChildParent,
  EmployeePerformanceReviewController.listEmployeePerformanceReview
);
router.get(
  '/v1/:id',
  verifyChildParent,
  EmployeePerformanceReviewController.getEmployeePerformanceReviewDetails
);
router.delete(
  '/v1',
  validateSchema(deleteEmployeePerformanceReview, reqObjectType.QUERY),
  verifyChildParent,
  EmployeePerformanceReviewController.deleteEmployeePerformanceReview
);
module.exports = router;
