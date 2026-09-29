const express = require('express');
const visitReportCustomizeValueController = require('../controllers/visitreportcustomizevalue.controller');
const router = express.Router();

router.post(
  '/v1/add',
  visitReportCustomizeValueController.postAddVisitReportCustomizeFieldValue
); // save data
router.post(
  '/v1/getalldata',
  visitReportCustomizeValueController.getAllVisitReportCustomizeFieldValueData
); //get all visitFormCustomizeValue data
router.get(
  '/v1/getbyid/:id',
  visitReportCustomizeValueController.getVisitReportCustomizeFieldValueById
); //get by id
router.post(
  '/v1/getbycompanyid',
  visitReportCustomizeValueController.getVisitReportCustomizeFieldValueByCompanyId
); //get by company id
router.post(
  '/v1/updatebyid',
  visitReportCustomizeValueController.postUpdateVisitReportCustomizeFieldValue
); //update visitFormCustomizeValue data
router.post(
  '/v1/deletebyid',
  visitReportCustomizeValueController.postAddVisitReportCustomizeFieldValue
); //delete by id
router.post(
  '/v1/bulkadd',
  visitReportCustomizeValueController.postAddBulkVisitReportCustomizeFieldValue
); //delete by id

module.exports = router;
