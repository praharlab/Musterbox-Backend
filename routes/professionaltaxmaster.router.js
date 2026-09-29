const express = require('express');
const professionalTaxController = require('../controllers/professionaltaxmaster.controller');
const router = express.Router();

router.post('/v1/add', professionalTaxController.postAddProfessionalTax); // save data
router.post(
  '/v1/getalldata',
  professionalTaxController.getAllProfessionalTaxData
); //get all professional tax data
router.get('/v1/getbyid/:id', professionalTaxController.getProfessionalTaxById); //get by id
router.post(
  '/v1/updatebyid',
  professionalTaxController.postUpdateProfessionalTax
); //update professional tax data
router.post(
  '/v1/deletebyid',
  professionalTaxController.postDeleteProfessionalTaxById
); //delete by id
router.post('/v1/statuschanges', professionalTaxController.poststatuschange); //status change

//router.post('/v1/validatequery', professionalTaxController.postValidateQuery); //validate query
//router.post('/v1/gettax', professionalTaxController.postGetTaxAmount); //get tax amount
//router.post('/v1/search', professionalTaxController.postSearchProfessionalTax); //search
module.exports = router;
