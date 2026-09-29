const express = require('express');
const hrLeavesMonthlyTransController = require('../controllers/hrLeavesMonthlyTrans.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post(
  '/v1/getalldata',
  hrLeavesMonthlyTransController.getAllHrLeavesMonthlyTrans
); //get all HrLeavesMonthlyTrans
router.post(
  '/v1/add',
  hrLeavesMonthlyTransController.postAddHrLeavesMonthlyTrans
); //add and save the data for Hr leave monthly trans
router.post(
  '/v1/delete',
  hrLeavesMonthlyTransController.postDeleteHrLeavesMonthlyTrans
); //delete the data by AttnTranId
router.post(
  '/v1/getbyusermasterid/:id',
  hrLeavesMonthlyTransController.getHrLeavesMonthlyTransbyUserMasterId
); //get HrLeavesMonthlyTrans by User master Id
router.post(
  '/v1/getbyleavetranid/:id',
  hrLeavesMonthlyTransController.getHrLeavesMonthlyTransbyLeaveTranId
); //get HrLeavesMonthlyTrans by Leave Trans ID
router.post(
  '/v1/update',
  hrLeavesMonthlyTransController.postUpdateMonWorkDaysAttnValbyAttnTranId
); // update monworkdays and attnval by updateByIp
router.post(
  '/v1/AttendanceBal',
  hrLeavesMonthlyTransController.getAttendanceValue
);
router.post(
  '/v1/updateTrans',
  hrLeavesMonthlyTransController.postUpdateLeaveAttnTranId
);
router.get(
  '/v1/empBasicData/:id',
  hrLeavesMonthlyTransController.getUserAttendnaceConfig
);
router.post(
  '/v1/deleteattendance',
  hrLeavesMonthlyTransController.deleteattendance
);
router.post(
  '/v1/attendanceCalculation',
  hrLeavesMonthlyTransController.attendanceCalculation
); // calculate attendance and store...
router.post(
  '/v1/getAttendanceCalculationbyuserid',
  hrLeavesMonthlyTransController.getAttendanceCalculationbyuserid
); // get by userid
router.post(
  '/v1/getVerifiedAllData',
  hrLeavesMonthlyTransController.getVerifiedAllData
); // get all verified data
router.post('/v1/dataUnverify', hrLeavesMonthlyTransController.dataUnverify); //  unverify by userid
router.post(
  '/v1/verifyAllAttendanceCalcution',
  hrLeavesMonthlyTransController.verifyAllAttendanceCalcution
); // verfify all data
router.post(
  '/v1/unVerifyAllAttendanceCalcution',
  hrLeavesMonthlyTransController.unVerifyAllAttendanceCalcution
); // unverify all data
router.post(
  '/v1/attendanceSummarybyuserid',
  hrLeavesMonthlyTransController.attendanceSummarybyuserid
);

router.post(
  '/v1/demoCountWiseAttendance',
  hrLeavesMonthlyTransController.demoCountWiseAttendance
);
router.post(
  '/v1/uploadCountWiseAttendance',
  uploadfile,
  hrLeavesMonthlyTransController.uploadCountWiseAttendance
);

// -------------------------Monthly Attendance Entry -------------------------

router.post(
  '/v1/listMonthlyAttendanceEntry',
  hrLeavesMonthlyTransController.listMonthlyAttendanceEntry
);

router.post(
  '/v1/saveMonthlyAttendanceEntry',
  hrLeavesMonthlyTransController.saveMonthlyAttendanceEntry
);

router.post(
  '/v1/deleteMonthlyAttendanceEntry',
  hrLeavesMonthlyTransController.deleteMonthlyAttendanceEntry
);

module.exports = router;
