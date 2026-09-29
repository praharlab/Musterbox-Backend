const express = require('express');
const MailFiledController = require('../controllers/mailFields.controller');
const router = express.Router();

router.post('/v1/add', MailFiledController.postAddMailFields); //save the data
router.post('/v1/getalldata', MailFiledController.getAllMailFieldsData); //get the data
router.post(
  '/v1/getMailFieldsByMailType',
  MailFiledController.getMailFieldsByMailType
); //get mailfields by mailtype id
router.post('/v1/deletebyid', MailFiledController.postDeleteMailFieldsById); //delete by id
router.post('/v1/statuschanges', MailFiledController.poststatuschange); //status by id
router.post(
  '/v1/getActiveMailTypeData',
  MailFiledController.getActiveMailTypeData
);
module.exports = router;
