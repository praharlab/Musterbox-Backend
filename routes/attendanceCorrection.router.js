const express = require('express');
const attendanceCorrectionController = require('../controllers/attendanceCorrection.controller');
const router = express.Router();

router.get('/v1/getAlldata/', attendanceCorrectionController.getAlldata);

module.exports = router;
