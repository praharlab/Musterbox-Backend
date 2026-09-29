const express = require('express');
const BiometricDataTransferContoller = require('../controllers/biometricDataTransfer.controller');
const router = express.Router();

router.post('/v1/sendDataToBiometric', BiometricDataTransferContoller.addDataToBiometric);

module.exports = router;
