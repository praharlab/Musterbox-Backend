const express = require('express');
const empDigitalSignatureController = require('../controllers/employeedigitalsignature.controller');
const router = express.Router();
const { uploadempsignature } = require('../middleware/upload');

router.post(
  '/v1/add',
  uploadempsignature,
  empDigitalSignatureController.postAddEmployeeDigitalSignature
); // save data
router.post(
  '/v1/getalldata',
  empDigitalSignatureController.getAllEmployeeDigitalSignatureData
); //get all digital signature data
router.get(
  '/v1/getbyid/:id',
  empDigitalSignatureController.getEmployeeDigitalSignatureById
); //get by id
router.get(
  '/v1/getbyuserid/:id',
  empDigitalSignatureController.getEmployeeDigitalSignatureByUserMasterId
); //get by user id
router.post(
  '/v1/updatebyid',
  uploadempsignature,
  empDigitalSignatureController.postUpdateEmployeeDigitalSignature
); //update digital signature data
router.post(
  '/v1/deletebyid',
  empDigitalSignatureController.postDeleteEmployeeDigitalSignatureById
); //delete by id
router.get(
  '/v1/getbyuserids/:id',
  empDigitalSignatureController.getEmployeeDigitalSignatureByUserMasterIdSelected
); //get by user id
router.post(
  '/v1/statuschanges',
  empDigitalSignatureController.poststatuschange
); //status change

module.exports = router;
