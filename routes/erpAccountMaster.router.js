const express = require('express');
const erpAccountMasterController = require('../controllers/erpAccountMaster.controller');
const router = express.Router();

router.post('/v1/add', erpAccountMasterController.postAdderpAccountMaster); // save data
router.get('/v1/getbyid/:id', erpAccountMasterController.geterpAccountMasterId); //get by id
router.post(
  '/v1/updatebyid',
  erpAccountMasterController.postUpdateerpAccountMaster
); //update companytype tax data
router.post(
  '/v1/deletebyid',
  erpAccountMasterController.postDeleteerpAccountMasterById
); //delete by id
router.post('/v1/statuschanges', erpAccountMasterController.poststatuschange); //status by id
router.post(
  '/v1/geterpAccountMasterByCompanyID',
  erpAccountMasterController.geterpAccountMastercompanyid
); // get by user
router.post('/v1/geterpaccount', erpAccountMasterController.geterpaccount); // get by user

module.exports = router;
