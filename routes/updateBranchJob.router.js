const express = require('express');
const UpdateBranchJobController = require('../controllers/updateBranchJob.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');
const { permissionAccess } = require('../middleware/permissionAccess');

router.post(
  '/v1/ExportDemojobTitle',
  permissionAccess,
  UpdateBranchJobController.ExportDemojobTitle_V2
);

router.post(
  '/v1/validatBranchJobTitle',
  permissionAccess,
  uploadfile,
  UpdateBranchJobController.validatBranchJobTitle
);

router.post(
  '/v1/addValidateBranchJob',
  UpdateBranchJobController.addValidateBranchJob
);
module.exports = router;
