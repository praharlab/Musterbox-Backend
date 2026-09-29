const express = require('express');
const operationController = require('../controllers/operation.controller');
const router = express.Router();

router.post('/v1/add', operationController.postAddOperation); // save data
router.post('/v1/getalldata', operationController.getAllOperationData); //get all bank data
router.get('/v1/getbyid/:id', operationController.getOperationById); //get by id
router.post('/v1/updatebyid', operationController.postUpdateOperation); //update bank data
router.post('/v1/deletebyid', operationController.postDeleteOperationById); //delete by id
router.post('/v1/statuschanges', operationController.poststatuschange); //status change
router.post(
  '/v1/getActiveOperationData',
  operationController.getActiveOperationData
); //status change

module.exports = router;
