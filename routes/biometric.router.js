const express = require('express');
const biometricController = require('../controllers/biometric.controller');
const router = express.Router();
const { uploadfile, uploaduserphoto } = require('../middleware/upload');
const { verifyToken } = require('../middleware/tokenverify');

router.get(
  '/v1/fulldayhalfdaycalculation/:id',
  verifyToken,
  biometricController.fulldayhalfdaycalculation
); // save data
router.post(
  '/v1/excelattendance',
  verifyToken,
  uploadfile,
  biometricController.excelattendance
); // save data
router.post(
  '/v1/biometricsync',
  verifyToken,
  biometricController.biometricsync
); // save data

router.post(
  '/v1/biometricvalidator',

  biometricController.biometricvalidator
); // Validate Biometric Attendance
router.get('/v1/DynamicData', biometricController.DynamicData); // Validate Biometric Attendance
router.get('/v1/AaryavartData', biometricController.AaryavartData);
router.post(
  '/v1/pendingbiometricsync',
  verifyToken,
  biometricController.pendingbiometricsync
);

router.get('/v1/biometricTestingAPI', biometricController.biometricTestingAPI);
router.get('/v1/heeraGroupBiometric', biometricController.heeraGroupBiometric);

router.post('/v1/addManualLog', biometricController.addManualLog);

router.get(
  '/v1/asopalavCommissionAPI',
  biometricController.asopalavCommissionAPI
);

router.post('/v1/generateDemoExcel', biometricController.generateDemoExcel);
router.post(
  '/v1/validateExcel',
  uploadfile,
  biometricController.validateUploadExcel
);

module.exports = router;
