const express = require('express');
const visitreportcustomizeController = require('../controllers/visitreportcustomize.controller');
const router = express.Router();

router.post(
  '/v1/add',
  visitreportcustomizeController.postAddVisitReportCustomize
); // save data
router.post(
  '/v1/getalldata',
  visitreportcustomizeController.getAllVisitReportCustomizeData
); //get all visitPurpose data
router.get(
  '/v1/getbyid/:id',
  visitreportcustomizeController.getVisitReportCustomizeById
); //get by id
router.post(
  '/v1/getbycompanyid',
  visitreportcustomizeController.getVisitReportCustomizeByCompanyId
); //get by company id
router.post(
  '/v1/updatebyid',
  visitreportcustomizeController.postUpdateVisitReportCustomize
); //update visitPurpose data
router.post(
  '/v1/deletebyid',
  visitreportcustomizeController.postDeleteVisitReportCustomizeById
); //delete by id

module.exports = router;
