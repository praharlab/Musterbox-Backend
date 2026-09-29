const express = require('express');
const ReviewFormController = require('../controllers/reviewForm.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  createReviewForm,
  listReviewForm,
  updateReviewForm,
} = require('../validators/reviewForm');

const router = express.Router();
router.post(
  '/v1',
  validateSchema(createReviewForm, reqObjectType.BODY),
  verifyChildParent,
  ReviewFormController.bulkCreateReviewForm
);
router.put(
  '/v1/:id',
  validateSchema(updateReviewForm),
  verifyChildParent,
  ReviewFormController.bulkUpdateReviewForm
);
router.get(
  '/v1/:id',
  verifyChildParent,
  ReviewFormController.getReviewFormDetails
);
router.get(
  '/v1',
  validateSchema(listReviewForm, reqObjectType.QUERY),
  verifyChildParent,
  ReviewFormController.listReviewForm
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  ReviewFormController.deleteReviewForm
);

module.exports = router;
