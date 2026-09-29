const express = require('express');
const attendanceCorrectionAuthorizationController = require('../controllers/attendanceCorrectionAuthorization.controller');
const router = express.Router();

router.post(
  '/attendancecorrectionauthorizationrequest',
  attendanceCorrectionAuthorizationController.authorizationacceptrejectAttendanceCorrection
);

router.post(
  '/listAttendaceAuthorization',
  attendanceCorrectionAuthorizationController.viewAuthorizationRequestByUserIdForAttendanceCorrection
);

router.get(
  '/attendanceauthorizationdatabyid/:id',
  attendanceCorrectionAuthorizationController.getAuthorizationRequestById
);

router.post(
  '/getAuthorizedUser',
  attendanceCorrectionAuthorizationController.AttendanceCorrectionAuthorizeduser
);
module.exports = router;
