const express = require('express');
const PenaltyReport = require('../controllers/penaltyreport.controller');
const router = express.Router();

router.post('/v1/getdata', PenaltyReport.getPenaltyData); //get the data

module.exports = router;
