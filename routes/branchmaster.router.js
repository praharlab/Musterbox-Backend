const express = require('express');
const branchMasterController = require('../controllers/branchmaster.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', branchMasterController.postAddBranch); // save data

router.get('/v1/getbyid/:id', branchMasterController.getBranchById); //get by id
router.get(
  '/v1/getbycompanyid/:id',
  branchMasterController.getBranchByCompanyId
); //get by company id
router.get('/v1/getbycityid/:id', branchMasterController.getBranchByCityId); //get by city id
router.post('/v1/updatebyid', branchMasterController.postUpdateBranch); //update branch data
router.post('/v1/deletebyid', branchMasterController.postDeleteBranchById); //delete by id
router.post('/v1/statuschange', branchMasterController.poststatuschange); //delete by id
router.post(
  '/v1/getAllBranchDataByCompanyId',
  branchMasterController.getAllBranchDataByCompanyId
); //delete by id
router.get(
  '/v1/getactivebranchbycompanyid/:id',
  branchMasterController.getactivebranchbycompanyid
);
router.post('/v1/uploadexcel', uploadfile, branchMasterController.uploadexcel);

router.post('/v1/validateExcel', uploadfile, branchMasterController.validateUploadExcel);

router.post('/v1/revalidateBranch', branchMasterController.revalidateBranch);

router.post('/v1/addValidateBranch', branchMasterController.addValidateBranch);

router.post('/v1/generateDemoExcel', branchMasterController.generateDemoExcel);

module.exports = router;
