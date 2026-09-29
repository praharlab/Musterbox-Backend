const express = require('express');
const sentimentPunchInController = require('../controllers/sentimentPunchIn.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');

const router = express.Router();
router.get(
  '/v1',
  verifyChildParent,
  sentimentPunchInController.listSentimentPunchIn
);
router.post('/v1', sentimentPunchInController.createSentimentPunchIn);
router.get(
  '/v1/analysis',
  verifyChildParent,
  sentimentPunchInController.sentimentPunchInsAnalysis
);

router.post(
  '/v1/getdata',
  verifyChildParent,
  sentimentPunchInController.getSentimentPunchIn
);
module.exports = router;
