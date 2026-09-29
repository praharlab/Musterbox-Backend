const express = require('express');
const { uploadfile } = require('../middleware/upload');

const depositcategoryController = require('../controllers/depositCategory.controller');
const router = express.Router();

router.post('/v1/add', depositcategoryController.postAddDepositCategory); // save data
router.get('/v1/getbyid/:id', depositcategoryController.getDepositCategoryId); //get by id
router.post(
  '/v1/updatebyid',
  depositcategoryController.postUpdateDepositCategory
); //update companytype tax data
router.post(
  '/v1/deletebyid',
  depositcategoryController.postDeleteDepositCategoryById
); //delete by id
router.post('/v1/statuschanges', depositcategoryController.poststatuschange); //status by id
router.post(
  '/v1/getDepositCategorycompanyid',
  depositcategoryController.getDepositCategorycompanyid
); //get by id
router.get(
  '/v1/getDepositCategoryByCompanyId/:id',
  depositcategoryController.getDepositCategoryByCompanyId
); //get by id
router.get(
  '/v1/getactivedepartmentbycompanyid/:id',
  depositcategoryController.getactivedepositCategorybycompanyid
);
router.post(
  '/v1/postUploadExcel',
  uploadfile,
  depositcategoryController.postUploadExcel
);

router.post('/v1/validateExcel', uploadfile, depositcategoryController.validateUploadExcel);

router.post('/v1/reValidateDepositCategory', depositcategoryController.reValidateDepositCategory);

router.post('/v1/addValidateDepositCategory', depositcategoryController.addValidateDepositCategory)

module.exports = router;
