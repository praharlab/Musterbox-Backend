const express = require('express');
const lastfiveattendancecontroller = require('../controllers/lastfiveattendance.controller');
const router = express.Router();

router.post(
  '/v1/getlastfiveattendance',
  lastfiveattendancecontroller.attendanceData
);
router.post('/v1/getAttendance', lastfiveattendancecontroller.attendanceData1);

module.exports = router;
