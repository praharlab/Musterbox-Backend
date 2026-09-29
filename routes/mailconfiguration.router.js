const express = require('express');
const mailConfigurationController = require('../controllers/mailconfiguration.controller');
const router = express.Router();

router.post('/v1/add', mailConfigurationController.postAddMailConfiguration); // save data
router.post(
  '/v1/getalldata',
  mailConfigurationController.getAllMailConfigurationData
); //get all mail config data
router.get(
  '/v1/getbyid/:id',
  mailConfigurationController.getMailConfigurationById
); //get by id
router.post(
  '/v1/updatebyid',
  mailConfigurationController.postUpdateMailConfiguration
); //update mail config data
router.post(
  '/v1/deletebyid',
  mailConfigurationController.postDeleteMailConfigurationById
); //delete by id
router.post('/v1/statuschange', mailConfigurationController.poststatuschange); //delete by id
module.exports = router;
