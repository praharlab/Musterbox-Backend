const express = require('express');
const LeaveMasterController = require('../controllers/hrLeaveMaster.contoller');
const router = express.Router();
const { uploadLeaveMaster } = require('../middleware/upload');

router.post('/v1/add', LeaveMasterController.postAddLeaveMaster); // save data
router.post('/v1/getalldata', LeaveMasterController.getAllLeaveMaster); //get all state data
router.post(
  '/v1/addfile',
  uploadLeaveMaster,
  LeaveMasterController.postImportData
); // save data
router.get('/v1/getbyid/:id', LeaveMasterController.getLeaveMasterById); //get by id
router.post('/v1/updatebyid', LeaveMasterController.postUpdateLeaveMaster); //update state data
router.post('/v1/deletebyid', LeaveMasterController.postDeleteLeaveMasterID); //delete by id
router.post('/v1/statuschanges', LeaveMasterController.poststatuschange); //status change
router.post(
  '/v1/getActiveLeaveMaster',
  LeaveMasterController.getActiveLeaveMaster
);
// Add CF Data in payheadmaster
router.get('/v1/addCFData', LeaveMasterController.addCFData);
// All CF Data In All Company
router.get(
  '/v1/addCFDataInAllCompany',
  LeaveMasterController.addCFDataInAllCompany
);

module.exports = router;
