const express = require('express');
const AdvanceReport = require('../controllers/AdvancePaymentReport.controller');
const router = express.Router();

router.post('/v1/getdata', AdvanceReport.getAdvanceData); //get the data

module.exports = router;
