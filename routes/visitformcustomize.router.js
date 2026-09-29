const express = require('express');
const visitformcustomizeController = require('../controllers/visitformcustomize.controller');
const router = express.Router();

router.post('/v1/add', visitformcustomizeController.postAddVisitFormCustomize); // save data
router.post(
  '/v1/getalldata',
  visitformcustomizeController.getAllVisitFormCustomizeData
); //get all visitPurpose data
router.get(
  '/v1/getbyid/:id',
  visitformcustomizeController.getVisitFormCustomizeById
); //get by id
router.post(
  '/v1/getbycompanyid',
  visitformcustomizeController.getVisitFormCustomizeByCompanyId
); //get by company id
router.post(
  '/v1/updatebyid',
  visitformcustomizeController.postUpdateVisitFormCustomize
); //update visitPurpose data
router.post(
  '/v1/deletebyid',
  visitformcustomizeController.postDeleteVisitFormCustomizeById
); //delete by id

module.exports = router;
