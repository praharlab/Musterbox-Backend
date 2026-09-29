const express = require('express');
const assetMasterController = require('../controllers/assetMaster.controller');
const router = express.Router();
const { uploadAssetMaster, uploadfile } = require('../middleware/upload');

router.post(
  '/v1/add',
  uploadAssetMaster,
  assetMasterController.postAddassetMaster
); // save data
router.get('/v1/getbyid/:id', assetMasterController.getassetMasterById); //get by id
router.post(
  '/v1/updatebyid',
  uploadAssetMaster,
  assetMasterController.updateassetMasterData
); //update  data
router.post('/v1/deletebyid', assetMasterController.deleteassetmaster); //delete by id
router.post('/v1/statuschanges', assetMasterController.poststatuschange); //status change
router.post('/v1/bycompanyid', assetMasterController.getAssetMasterbyCompanyId); //get by company id
router.post(
  '/v1/getassetcategorybycompid',
  assetMasterController.getAssetCategoriesForSelectedCompany
); //get asset category by company id

router.post(
  '/v1/validateExcel',
  uploadfile,
  assetMasterController.validateUploadExcel
);

router.post(
  '/v1/revalidateAssetMaster',
  assetMasterController.revalidateAssetMaster
);

router.post(
  '/v1/addValidateAssetMaster',
  assetMasterController.addValidateAssetMaster
);

router.post('/v1/generateDemoExcel', assetMasterController.generateDemoExcel);

module.exports = router;
