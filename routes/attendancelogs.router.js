const express = require('express');
const router = express.Router();
const attendancelogsController = require('../controllers/attendancelog.controller');

router.post('/v1/add', attendancelogsController.postSaveAttendanceLogs);
router.post('/v1/getAll', attendancelogsController.postReturnAllAttendanceLogs);
router.post('/v1/update', attendancelogsController.postUpdateAttendanceLogs);
router.post('/v1/delete', attendancelogsController.postDeleteAttendanceLogs);

module.exports = router;
