const express = require('express');
const attendancetransactionController = require('../controllers/attendancetransaction.controller');
const router = express.Router();

router.post('/v1/attendanceApi', attendancetransactionController.attendanceApi); //Attendance Api
router.post(
  '/v1/attendanceData',
  attendancetransactionController.attendanceData
); //USED IN MOBILE ONLY

router.post(
  '/v1/attendancereport',
  attendancetransactionController.attendancereport
); //Date Wise
router.post(
  '/v1/getovertimeuserwise',
  attendancetransactionController.getovertimeuserwise
);
router.post(
  '/v1/branchwiseattendancereport',
  attendancetransactionController.branchwiseattendancereport
);
router.post(
  '/v1/attendanceByUserid',
  attendancetransactionController.attendanceByUserid
);
router.get(
  '/v1/getAttendanceLogsByTrnsactionId/:id',
  attendancetransactionController.getAttendanceLogsByTrnsactionId
);

router.post(
  '/v1/dashboardpunchinout',
  attendancetransactionController.dashboardpunchinout
);
router.post(
  '/v1/getcalenderdatamonthwise',
  attendancetransactionController.getcalenderdatamonthwise
);

router.post('/v1/shiftupdate', attendancetransactionController.shiftupdate);

router.get(
  '/v1/userAttendanceSummary',
  attendancetransactionController.getUserAttendanceSummary
);


router.get(
  '/v1/dashboardpunchinoutNEW',
  attendancetransactionController.dashboardpunchinoutNEW
);

router.get(
  '/v1/dashboardattendanceNEW',
  attendancetransactionController.dashboardattendanceNEW
);

router.post(
  '/v1/dashboardMisspunchReport',
  attendancetransactionController.dashboardMisspunchReport
);

router.get(
  '/v1/LateComeEarlyGo',
  attendancetransactionController.LateComeEarlyGoReport
);

router.get('/v1/getLeaveExcel', attendancetransactionController.getLeaveExcel);

router.post(
  '/v1/AttendanceReportMain',
  attendancetransactionController.AttendanceReportMain
);
router.post(
  '/v1/getDailyHourlyReport',
  attendancetransactionController.getDailyHourlyReport
);

router.get(
  '/v1/getPerDayCostDepartmentWise',
  attendancetransactionController.getPerDayCostDepartmentWise
);

router.post(
  '/v1/totalPunchIn',
  attendancetransactionController.totalpunchInCount
);

router.post('/v1/totalpunchIn1', attendancetransactionController.totalpunchIn);

router.post(
  '/v2/attendancestatus',
  attendancetransactionController.attendancestatus_V2
);

router.post(
  '/v1/getUserLogDateWise',
  attendancetransactionController.getUserLogDateWise
);

router.post(
  '/v1/attendanceTimingReport',
  attendancetransactionController.attendanceTimingReport
);

router.post(
  '/v1/attendanceTranUser',
  attendancetransactionController.attendanceByCompanyId
);

// Add manually LCEG Penalty
router.post('/v1/addLCEGPenalty', attendancetransactionController.addLCEGPenalty);

// Remove Manually LCEG Penalty
router.post('/v1/deleteLCEGPenalty', attendancetransactionController.deleteLCEGPenalty);


module.exports = router;
