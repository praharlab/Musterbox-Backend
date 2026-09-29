const express = require('express');
const AssetReportController = require('../controllers/Assetreport.controller');
const router = express.Router();

router.post('/v1/getdata', AssetReportController.getAssetData); //get the data

module.exports = router;
