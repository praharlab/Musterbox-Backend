const express = require('express');
const PerformanceReviewController = require('../controllers/performanceReview.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  createPerformanceReview,
  listPerformanceReview,
  updatePerformanceReview,
} = require('../validators/performanceReview');

const router = express.Router();
router.post(
  '/v1',
  validateSchema(createPerformanceReview, reqObjectType.BODY),
  verifyChildParent,
  PerformanceReviewController.createPerformanceReview
);
router.put(
  '/v1/:id',
  validateSchema(updatePerformanceReview, reqObjectType.BODY),
  verifyChildParent,
  PerformanceReviewController.updatePerformanceReview
);
router.get(
  '/v1',
  validateSchema(listPerformanceReview, reqObjectType.QUERY),
  verifyChildParent,
  PerformanceReviewController.listPerformanceReview
);
router.get(
  '/v1/:id',
  verifyChildParent,
  PerformanceReviewController.getPerformanceReviewDetails
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  PerformanceReviewController.deletePerformanceReview
);
module.exports = router;
