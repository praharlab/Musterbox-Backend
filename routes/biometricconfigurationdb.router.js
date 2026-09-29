const express = require('express');
const biometricController = require('../controllers/biometricconfigurationdb.controller');
const router = express.Router();

router.post(
  '/v1/biometricDatabase',
  biometricController.biometricDatabaseList
);
router.post(
  '/v1/biometricGetTable',
  biometricController.biometricTableList
);
router.post(
  '/v1/biometricGetSerialNo',
  biometricController.biometricSerialNoList
);
router.post(
  '/v1/biometricCreateTable',
  biometricController.createBiometricTable
);
// router.post('/v1/tptesting', biometricController.biometricTableList1);

module.exports = router;
