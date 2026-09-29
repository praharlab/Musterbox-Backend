const express = require('express');
const companyregistercontroller = require('../controllers/companyRegister.controller');
const router = express.Router();

router.post('/v1/add', companyregistercontroller.postAddCompanyRegister); // save data
router.post('/v1/getalldata', companyregistercontroller.getAllcompanyRegister); //get all companytype tax data
router.get('/v1/getbyid/:id', companyregistercontroller.getcompanyRegisterId); //get by id
router.post(
  '/v1/updatebyid',
  companyregistercontroller.postUpdatecompanyRegister
); //update companytype tax data
router.post(
  '/v1/deletebyid',
  companyregistercontroller.postDeletecompanyRegisterById
); //delete by id
router.post('/v1/statuschanges', companyregistercontroller.poststatuschange); //status by id
module.exports = router;
