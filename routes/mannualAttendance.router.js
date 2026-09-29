const express = require('express');
const { uploadfile } = require('../middleware/upload');
const mannualAttendanceController = require('../controllers/mannualAttendance.controller');
const router = express.Router();

router.post('/v1/getAlldata', mannualAttendanceController.getAlldata);
router.post(
  '/v1/uploadboimetricexcel',
  uploadfile,
  mannualAttendanceController.uploadboimetricexcel
);

router.post('/v2/getAlldata', mannualAttendanceController.getAlldata_V2);

router.post(
  '/v2/addmanualAttendance',
  mannualAttendanceController.addmanualAttendance_V2
);

module.exports = router;
