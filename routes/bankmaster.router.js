const express = require('express');
const bankMasterController = require('../controllers/bankmaster.controller');
const router = express.Router();

router.post('/v1/add', bankMasterController.postAddBank); // save data
router.post('/v1/getalldata', bankMasterController.getAllBankData); //get all bank data
router.get('/v1/getbyid/:id', bankMasterController.getBankById); //get by id
router.post('/v1/updatebyid', bankMasterController.postUpdateBank); //update bank data
router.post('/v1/deletebyid', bankMasterController.postDeleteBankById); //delete by id
router.post('/v1/statuschange', bankMasterController.poststatuschange); //delete by id
router.post('/v1/testUtil', bankMasterController.testUtil); //delete by id
router.post('/v1/getactivebankdata', bankMasterController.getActiveBankData); //get active data

module.exports = router;
