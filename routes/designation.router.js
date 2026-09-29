const express = require('express');
const designationController = require('../controllers/designation.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', designationController.postAddDesignation); // save data
router.get('/v1/getbyid/:id', designationController.getDesignationId); //get by id
router.post('/v1/updatebyid', designationController.postUpdateDesignation); //update companytype tax data
router.post('/v1/deletebyid', designationController.postDeleteDesignationById); //delete by id
router.post('/v1/statuschanges', designationController.poststatuschange); //status by id
router.post(
  '/v1/getDesignationcompanyid',
  designationController.getDesignationcompanyid
); //get by id
router.get(
  '/v1/getDesignationByCompanyId/:id',
  designationController.getDesignationByCompanyId
); //get by id
router.get(
  '/v1/getactivedesignationbycompanyid/:id',
  designationController.getactivedesignationbycompanyid
);
router.post('/v1/uploadexcel', uploadfile, designationController.uploadexcel);

router.post('/v1/validateExcel', uploadfile, designationController.validateUploadExcel);

router.post('/v1/reValidateDesignation', designationController.reValidateDesignation);

router.post('/v1/addValidateDesignation', designationController.addValidateDesignation)

module.exports = router;
