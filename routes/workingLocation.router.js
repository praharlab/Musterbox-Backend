const express = require('express');
const WorkingLocation = require('../controllers/workingLocation.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');


router.post('/v1/add', WorkingLocation.postAddWorkingLocation); // save data\
router.get('/v1/getbyid/:id', WorkingLocation.getWorkingLocationById); //get by id
router.post('/v1/updatebyid', WorkingLocation.postUpdateWokingLocation);

router.post('/v1/statuschange', WorkingLocation.poststatuschange); //delete by id

router.post('/v1/deletebyid', WorkingLocation.postDeleteWorkingLocationById);
router.post(
  '/v1/getworkinglocationReports',
  WorkingLocation.getWorkingLocationReports
);
router.post(
  '/v1/validateExcel',
  uploadfile,
  WorkingLocation.validateUploadExcel
);

router.post('/v1/revalidateWorkingLocation', WorkingLocation.revalidateWorkingLocation);

router.post('/v1/addValidateWorkingLocation', WorkingLocation.addValidateWorkingLocation);

router.post('/v1/generateDemoExcel', WorkingLocation.generateDemoExcel);
module.exports = router;
