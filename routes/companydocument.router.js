const express = require('express');
const companyDocumentController = require('../controllers/companydocument.controller');
const router = express.Router();
const { uploadcompanydocument } = require('../middleware/upload');

router.post(
  '/v1/add',
  uploadcompanydocument,
  companyDocumentController.postAddCompanyDocument
); // save data
router.post(
  '/v1/getalldata',
  companyDocumentController.getAllCompanyDocumentData
); //get all company document data
router.get('/v1/getbyid/:id', companyDocumentController.getCompanyDocumentById); //get by id
router.post(
  '/v1/getbyuserid',
  companyDocumentController.getCompanyDocumentByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  uploadcompanydocument,
  companyDocumentController.postUpdateCompanyDocument
); //update company document data
router.post(
  '/v1/deletebyid',
  companyDocumentController.postDeleteCompanyDocumentById
); //delete by id
router.post('/v1/statuschanges', companyDocumentController.poststatuschange); //status change
router.get(
  '/v1/getbyuserid/:id',
  companyDocumentController.getUserDocumentByUserMasterId
); //get by user id

module.exports = router;
