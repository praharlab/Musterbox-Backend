const express = require('express');
const ReviewFormAnswerController = require('../controllers/reviewFormAnswer.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  bulkCreateUpdateReviewFormAnswers,
  listReviewFormAnswers,
} = require('../validators/reviewFormAnswer');

const router = express.Router();
router.post(
  '/v1',
  validateSchema(bulkCreateUpdateReviewFormAnswers, reqObjectType.BODY),
  verifyChildParent,
  ReviewFormAnswerController.bulkInsertUpdateReviewFormAnswers
);
router.get(
  '/v1/:id',
  verifyChildParent,
  ReviewFormAnswerController.getReviewFormAnswerDetails
);
router.get(
  '/v1',
  validateSchema(listReviewFormAnswers, reqObjectType.QUERY),
  verifyChildParent,
  ReviewFormAnswerController.listReviewFormAnswers
);

module.exports = router;
