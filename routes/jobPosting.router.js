const express = require('express');
const router = express.Router();
const JobPostingController = require('../controllers/jobPosting.controller');
const { verifyToken } = require('../middleware/tokenverify');

router.post(
  '/v1/addJobPosting',
  verifyToken,
  JobPostingController.addJobPosting
);

router.post(
  '/v1/listJobPostingData',
  verifyToken,
  JobPostingController.listJobPostingData
);

router.get(
  '/v1/getJobPostingByID',
  verifyToken,
  JobPostingController.getJobPostingByID
);

router.put(
  '/v1/editJobPosting',
  verifyToken,
  JobPostingController.editJobPosting
);

router.post(
  '/v1/deleteJobPosting',
  verifyToken,
  JobPostingController.deleteJobPosting
);

router.get(
  '/v1/getJobPostingBySecrectKey',
  JobPostingController.getJobPostingBySecrectKey
);

module.exports = router;
