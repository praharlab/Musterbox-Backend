const express = require('express');
const preboardingRequestController = require('../controllers/preboardingrequest.controller');
const router = express.Router();

router.post('/v1/add', preboardingRequestController.postAddPreboardingRequest); // save data

router.post(
  '/v1/getalldata',
  preboardingRequestController.getAllPreboardingRequestData
); //get all product data

router.post(
  '/v1/updatebyid',
  preboardingRequestController.postUpdatePreboardingRequest
); //update product data

router.get(
  '/v1/getPreboardingRequestByPreboardingId/:id',
  preboardingRequestController.getPreboardingRequestByPreboardingId
); //update product data
module.exports = router;
