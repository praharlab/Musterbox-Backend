const express = require('express');
const visitReportMasterController = require('../controllers/visitreportmaster.controller');
const router = express.Router();

router.post('/v1/add', visitReportMasterController.postAddVisitReport); // save data
router.post(
  '/v1/getalldatabycompanyid',
  visitReportMasterController.getAllVisitReportDataByCompanyID
); //get all bank data
router.get('/v1/getbyid/:id', visitReportMasterController.getVisitReportById); //get by id
router.get(
  '/v1/getbycompany/:id',
  visitReportMasterController.getVisitReportBycompany
); //get by id
router.post(
  '/v1/updatebyid',
  visitReportMasterController.postUpdateVisitReport
); //update bank data
router.post(
  '/v1/deletebyid',
  visitReportMasterController.postDeleteVisitReportById
); //delete by id
router.post('/v1/statuschanges', visitReportMasterController.poststatuschange); //status change
module.exports = router;
