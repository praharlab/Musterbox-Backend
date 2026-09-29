const express = require("express");
const router = express.Router();
const jobRoleClassificationController = require("../controllers/jobRoleClassification.controller");

// const JobRoleClassification = require('../models/jobRoleClassification');

router.post(
  "/v1/addJobRoleClassification",
  jobRoleClassificationController.addJobRoleClassification
);
router.post(
  "/v1/listJobRoleClassification",
  jobRoleClassificationController.listJobRoleClassification
);
router.get(
  "/v1/getJobRoleClassificationByID",
  jobRoleClassificationController.getJobRoleClassificationByID
);
router.post(
  "/v1/editJobRoleClassificationByID",
  jobRoleClassificationController.editJobRoleClassificationByID
);
router.post(
  "/v1/deleteJobRoleClassificationByID",
  jobRoleClassificationController.deleteJobRoleClassificationByID
);

module.exports = router;
