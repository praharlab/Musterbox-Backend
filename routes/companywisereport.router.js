const express = require('express');
const companywiseReportController = require('../controllers/companywisereport.controller');
const router = express.Router();

router.post('/v1/add', companywiseReportController.postAddCompanywiseReport); // save data
router.post(
  '/v1/getalldata',
  companywiseReportController.getAllCompanywiseReportData
); //get all bank data
router.get(
  '/v1/getbyid/:id',
  companywiseReportController.getCompanywiseReportById
); //get by id
router.post(
  '/v1/updatebyid',
  companywiseReportController.postUpdateCompanywiseReport
); //update bank data
router.post(
  '/v1/deletebyid',
  companywiseReportController.postDeleteCompanywiseReportById
); //delete by id
router.post('/v1/statuschange', companywiseReportController.poststatuschange); //delete by id
router.get(
  '/v1/getCompanywiseReportByCompanyId/:id',
  companywiseReportController.getCompanywiseReportByCompanyId
); //delete by id
router.post('/v1/getdataofreport', companywiseReportController.getdataofreport); //delete by id

module.exports = router;
