const express = require('express');
const authorizationMasterController = require('../controllers/authorizationmaster.controller');
const router = express.Router();

router.post(
  '/v1/add',
  authorizationMasterController.postAddAuthorizationMaster
); // save data
router.post(
  '/v1/getalldata',
  authorizationMasterController.getAllAuthorizationMasterData
); //get all bank data
router.get(
  '/v1/getbyid/:id',
  authorizationMasterController.getAuthorizationMasterById
); //get by id
router.post(
  '/v1/updatebyid',
  authorizationMasterController.postUpdateAuthorizationMaster
); //update bank data
router.post(
  '/v1/deletebyid',
  authorizationMasterController.postDeleteAuthorizationMasterById
); //delete by id
router.post('/v1/statuschange', authorizationMasterController.poststatuschange); //delete by id

router.post(
  '/v1/getActiveAuthorizationMasterData',
  authorizationMasterController.getActiveAuthorizationMasterData
);

module.exports = router;
