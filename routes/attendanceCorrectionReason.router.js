const express = require('express');
const AttendanceCorrectionReasonController = require('../controllers/attendanceCorrectionReason.controller');


const router = express.Router();

router.post('/v1/add', AttendanceCorrectionReasonController.addAttendanceCorrectionReason);
router.post('/v1/list', AttendanceCorrectionReasonController.listAttendanceCorrectionReason);
router.get('/v1/getByID/:id', AttendanceCorrectionReasonController.getAttendanceCorrectionReasonByID);
router.put('/v1/edit', AttendanceCorrectionReasonController.editAttendanceCorrectionReasonByID);
router.delete('/v1/deleteById', AttendanceCorrectionReasonController.deleteAttendanceCorrectionReasonByID);
router.post('/v1/addCorrectionReasonToAllCompany', AttendanceCorrectionReasonController.addCorrectionReasonToAllCompany);

module.exports = router;