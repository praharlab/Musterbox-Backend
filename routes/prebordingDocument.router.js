const express = require('express');
const preboardingController = require('../controllers/prebordingDocument.controller');
const { verifyToken } = require('../middleware/tokenverify');
const {
  uploadUserDocument,
} = require('../middleware/upload');
const router = express.Router();

router.post(
  '/v1/addDocs',
  uploadUserDocument,
  preboardingController.addDocs
)

router.get(
  '/v1/getByPreBordingId/:id',
  verifyToken,
  preboardingController.getByPreBordingId
)

module.exports = router;
