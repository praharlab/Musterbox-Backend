const express = require('express');
const visitPurposeController = require('../controllers/visitpurpose.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', visitPurposeController.postAddVisitPurpose); // save data
router.post('/v1/getalldata', visitPurposeController.getAllVisitPurposeData); //get all visitPurpose data
router.get('/v1/getbyid/:id', visitPurposeController.getVisitPurposeById); //get by id
router.post(
  '/v1/getbycompanyid',
  visitPurposeController.getVisitPurposeByCompanyId
); //get by company id
router.post('/v1/updatebyid', visitPurposeController.postUpdateVisitPurpose); //update visitPurpose data
router.post(
  '/v1/deletebyid',
  visitPurposeController.postDeleteVisitPurposeById
); //delete by id
router.post('/v1/statuschanges', visitPurposeController.poststatuschange); //status change

router.post('/v1/uploadexcel', uploadfile, visitPurposeController.uploadexcel); //upload excel

router.post(
  '/v1/validateExcel',
  uploadfile,
  visitPurposeController.validateUploadExcel
);

router.post(
  '/v1/reValidateVisitPurpose',
  visitPurposeController.reValidateVisitPurpose
);

router.post(
  '/v1/addValidateVisitPurpose',
  visitPurposeController.addValidateVisitPurpose
);
module.exports = router;
