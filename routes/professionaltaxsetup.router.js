const express = require('express');
const ptStatusController = require('../controllers/professionaltaxsetup.controller');
const router = express.Router();

router.post('/v1/add', ptStatusController.postAddProfessionalTaxSetup); // save data
router.post(
  '/v1/getalldata',
  ptStatusController.getAllProfessionalTaxSetupData
); //get all professional tax status data
router.get('/v1/getbyid/:id', ptStatusController.getProfessionalTaxSetupById); //get by id
router.post(
  '/v1/getbycompanyid/:id',
  ptStatusController.getProfessionalTaxSetupByCompanyId
); //get by company id
router.post(
  '/v1/updatebyid',
  ptStatusController.postUpdateProfessionalTaxSetup
); //update professional tax status data
router.post(
  '/v1/deletebyid',
  ptStatusController.postDeleteProfessionalTaxSetupById
); //delete by id
router.post('/v1/statuschanges', ptStatusController.poststatuschange); //status change
router.post('/v1/getalldatapt', ptStatusController.getalldatapt); //status change
module.exports = router;
