const express = require('express');
const visitFormCustomizeValueController = require('../controllers/visitfieldcustomizevalue.controller');
const router = express.Router();

router.post(
  '/v1/add',
  visitFormCustomizeValueController.postAddVisitCustomizeFieldValue
); // save data
router.post(
  '/v1/getalldata',
  visitFormCustomizeValueController.getAllVisitCustomizeFieldValueData
); //get all visitFormCustomizeValue data
router.get(
  '/v1/getbyid/:id',
  visitFormCustomizeValueController.getVisitCustomizeFieldValueById
); //get by id
router.post(
  '/v1/getbycompanyid',
  visitFormCustomizeValueController.getVisitCustomizeFieldValueByCompanyId
); //get by company id
router.post(
  '/v1/updatebyid',
  visitFormCustomizeValueController.postUpdateVisitCustomizeFieldValue
); //update visitFormCustomizeValue data
router.post(
  '/v1/deletebyid',
  visitFormCustomizeValueController.postDeleteVisitCustomizeFieldValueById
); //delete by id
router.post(
  '/v1/addbulk',
  visitFormCustomizeValueController.postAddBulkVisitCustomizeFieldValue
);
router.post(
  '/v1/updatebulk',
  visitFormCustomizeValueController.postUpdateBulkVisitCustomizeFieldValue
);

router.post(
  '/v1/webadd',
  visitFormCustomizeValueController.postAddVisitCustomizeFieldValueWeb
);
router.post(
  '/v1/webupdatebyid',
  visitFormCustomizeValueController.postUpdateVisitCustomizeFieldValueWeb
);
module.exports = router;
