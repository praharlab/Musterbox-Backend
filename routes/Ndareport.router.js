const express = require('express');
const Ndareportcontroller = require('../controllers/Ndareport.controller');
const router = express.Router();

router.post('/v1/getdata', Ndareportcontroller.getNdaData); //get the data
router.post('/v1/getdatadeposit', Ndareportcontroller.getdepositData); //get the data
router.post('/v1/getbycompanyid', Ndareportcontroller.getreportbyCompanyId); //get the data by company id

module.exports = router;
