const express = require('express');
const EsicSetupController = require('../controllers/esicsetup.controller');
const router = express.Router();

router.post('/v1/add', EsicSetupController.postAddESICSetup); // save data
router.post('/v1/getalldata', EsicSetupController.getAllESICSetupData); //get all esic setup data
router.get('/v1/getbyid/:id', EsicSetupController.getESICSetupById); //get by id
router.post(
  '/v1/getbycompanyid/:id',
  EsicSetupController.getESCISetupByCompanyId
); //get by company id
router.post('/v1/updatebyid', EsicSetupController.postUpdateESICSetup); //update esic setup data
router.post('/v1/deletebyid', EsicSetupController.postDeleteStateById); //delete by id
router.post('/v1/statuschanges', EsicSetupController.poststatuschange); //status change
router.post('/v1/getalldatapt', EsicSetupController.getalldatapt); //status change
module.exports = router;
