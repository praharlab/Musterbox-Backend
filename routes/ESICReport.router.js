const express = require('express');
const ESICReportController = require('../controllers/ESICReport.controller');
const router = express.Router();

router.post('/v1/getData', ESICReportController.getESICReportData);

module.exports = router;
