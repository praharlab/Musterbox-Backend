const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplication.controller');
const { verifyToken } = require('../middleware/tokenverify');
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/job'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

router.post(
  '/v1/addJobApplication',
  multerMiddleware.single('resumeAttachment'),
  handleMulterErrors,
  jobApplicationController.addJobApplication
); // save data
router.post(
  '/v1/listJobApplication',
  verifyToken,
  jobApplicationController.listJobApplication
); // List data

router.get(
  '/v1/getApplicationByID',
  verifyToken,
  jobApplicationController.getApplicationByID
);
router.post(
  '/v1/jobApplicationAcceptreject',
  verifyToken,
  jobApplicationController.jobApplicationAcceptreject
);


router.get(
  '/v1/getApplicationByIDOpen',
  jobApplicationController.getApplicationByIDOpen
);
module.exports = router;
