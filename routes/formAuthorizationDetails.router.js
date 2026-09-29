const express = require('express');
const formAuthorizationDetailsController = require('../controllers/formAuthorizationDetails.controller');
const router = express.Router();

router.post(
  '/v1/add',
  formAuthorizationDetailsController.postAddFormAuthorizationDetails
); // save data
router.post(
  '/v1/getalldata',
  formAuthorizationDetailsController.getFormAuthorizationDetails
); // all data
router.post(
  '/v1/deletebyid',
  formAuthorizationDetailsController.postDeleteFormAuthorizationDetailsById
); // delete by id data
router.post(
  '/v1/statuschanges',
  formAuthorizationDetailsController.poststatuschange
); // delete by id data
router.get(
  '/v1/getbyid/:id',
  formAuthorizationDetailsController.getFormAuthorizationDetailsById
); // get by id data
router.post(
  '/v1/updatebyid',
  formAuthorizationDetailsController.postUpdateFormAuthorizationDetails
); // get by id data
router.get(
  '/v1/getByUserId/:id',
  formAuthorizationDetailsController.getFormAuthorizationDetailsByUserId
); // get by id data

module.exports = router;
