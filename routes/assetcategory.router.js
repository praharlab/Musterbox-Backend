const express = require('express');
const { uploadfile } = require('../middleware/upload');

const assetCategoryController = require('../controllers/assetcategory.controller');
const router = express.Router();

router.post('/v1/add', assetCategoryController.postAddAssetCategory); // save data
router.post('/v1/getalldata', assetCategoryController.getAllAssetCategoryData); //get all asset category data
router.get('/v1/getbyid/:id', assetCategoryController.getAssetCategoryById); //get by id
router.post('/v1/updatebyid', assetCategoryController.postUpdateAssetCategory); //update asset category data
router.post(
  '/v1/deletebyid',
  assetCategoryController.postDeleteAssetCategoryById
); //delete by id
router.post('/v1/statuschanges', assetCategoryController.poststatuschange); //status by id
router.post(
  '/v1/getbycompanyid',
  assetCategoryController.getAssetCategoryByCompanyId
); //get by company id
router.get(
  '/v1/getactiveassetcategorybycompanyid/:id',
  assetCategoryController.getactiveassetcategorybycompanyid
); //get by company id
router.post(
  '/v1/uploadAssetExcel',
  uploadfile,
  assetCategoryController.uploadAssetExcel
);
router.post('/v1/validateExcel', uploadfile, assetCategoryController.validateUploadExcel);

router.post('/v1/reValidateAssetCategory', assetCategoryController.reValidateAssetCategory);

router.post('/v1/addValidateAssetCategory', assetCategoryController.addValidateAssetCategory)

module.exports = router;
