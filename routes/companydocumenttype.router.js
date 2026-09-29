const express = require('express');
const companyDocumentTypeController = require('../controllers/companydocumenttype.controller');
const router = express.Router();

router.post(
  '/v1/add',
  companyDocumentTypeController.postAddCompanyDocumentType
); // save data
router.post(
  '/v1/getalldata',
  companyDocumentTypeController.getAllCompanyDocumentTypeData
); //get all company document type data
router.get(
  '/v1/getbyid/:id',
  companyDocumentTypeController.getCompanyDocumentTypeById
); //get by id

router.post(
  '/v1/updatebyid',
  companyDocumentTypeController.postUpdateCompanyDocumentType
); //update company document type data
router.post(
  '/v1/deletebyid',
  companyDocumentTypeController.postDeleteCompanyDocumentTypeById
); //delete by id
router.post(
  '/v1/statuschanges',
  companyDocumentTypeController.poststatuschange
); //status change

router.post(
  '/v1/getActiveCompanyDocumentTypeData',
  companyDocumentTypeController.getActiveCompanyDocumentTypeData
);
module.exports = router;
