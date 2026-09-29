const express = require('express');
const employeeRentedResidence = require('../controllers/employeeRentedResidence.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadEmployeeRentedResidence } = require('../middleware/upload');

const router = express.Router();

router.post(
  '/v1/addData',
  uploadEmployeeRentedResidence,
  employeeRentedResidence.addData
); // save data
router.get('/v1/getData', employeeRentedResidence.getData);
router.post('/v1/delete', employeeRentedResidence.delete);
router.post('/v1/getAll', employeeRentedResidence.listDeclarationRequest);
router.post(
  '/v1/acceptReject',
  employeeRentedResidence.acceptRejectDeclarationRequest
);

module.exports = router;
