const express = require('express');
const employeeWorkingAreaController = require('../controllers/employeeWorkingArea.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.post('/v1/addData', employeeWorkingAreaController.addData); // save data
router.get('/v1/getByUserId/:id', employeeWorkingAreaController.getByUserId); // get data

router.post('/v1/addbulk', employeeWorkingAreaController.addBulk); // add bulk data

router.get(
  '/v1/getDataBycompanyId/:id',
  employeeWorkingAreaController.getDataBycompanyId
); // get data

router.get(
  '/v1/getEmployeeWorkingAreaByCompany',
  verifyChildParent,
  employeeWorkingAreaController.getEmployeeWorkingAreaByCompany
);

router.get(
  '/v1/downloadDemoExcel',
  employeeWorkingAreaController.downloadDemoExcel
);
router.post(
  '/v1/uploadWorkingArea',
  uploadfile,
  employeeWorkingAreaController.uploadWorkingArea
);
router.post(
  '/v1/deletebyid',
  uploadfile,
  employeeWorkingAreaController.postDeleteEmployeeWorkingArea
);

module.exports = router;
