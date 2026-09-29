const express = require('express');
const biometricIntegration = require('../controllers/biometricIntegration.controller');
const router = express.Router();

router.post('/v1/add', biometricIntegration.postAddBiometricIntegration); // save data
router.post('/v1/getAll', biometricIntegration.getAllBiometricIntegration); // get all data
router.get('/v1/getbyid/:id', biometricIntegration.getBiometricIntegrationById); // get by ID
router.post('/v1/statusChange', biometricIntegration.poststatuschange); // status change
router.post(
  '/v1/delete',
  biometricIntegration.postDeletebiometricIntegrationById
); // delete by id
router.post('/v1/update', biometricIntegration.postUpdateBiometricIntegration); // update by id
router.post(
  '/v1/getbycomp',
  biometricIntegration.getBiometricIntegrationByCompId
); // get by comp id
router.post('/v1/getBiometricList', biometricIntegration.getBiometricList);
router.post(
  '/v1/getbytable',
  biometricIntegration.getBiometricIntegrationByTable
); // get by comp id
router.post('/v1/removeSerialNo', biometricIntegration.RemoveSerialNo); // get by comp id

router.post(
  '/v1/deleteBycompanyMasterID',
  biometricIntegration.postDeletebiometricIntegrationBycompanyMasterID
);

router.post(
  '/v1/checkBiometricStatus',
  biometricIntegration.checkBiometricStatus
);


router.post(
  '/v1/checkunassignedEmployeeCodeData',
  biometricIntegration.checkunassignedEmployeeCodeData
);

router.post(
  '/v1/getbyChildParentCompany',
  biometricIntegration.getbyChildParentCompany
); // get by comp id
module.exports = router;
