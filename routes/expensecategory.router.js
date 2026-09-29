const express = require('express');
const { uploadfile } = require('../middleware/upload');

const expensecategoryController = require('../controllers/expensecategory.controller');
const router = express.Router();

router.post('/v1/add', expensecategoryController.postAddexpenseCategory); // save data
router.post('/v1/getalldata', expensecategoryController.getAllexpenseCategory); //get all companytype tax data
router.get('/v1/getbyid/:id', expensecategoryController.getexpenseCategoryId); //get by id
router.post(
  '/v1/updatebyid',
  expensecategoryController.postUpdateexpenseCategory
); //update companytype tax data
router.post(
  '/v1/deletebyid',
  expensecategoryController.postDeleteexpenseCategoryById
); //delete by id
router.post('/v1/statuschanges', expensecategoryController.poststatuschange); //status by id
router.post(
  '/v1/getExpenseCategorycompanyid',
  expensecategoryController.getexpenseCategorycompanyid
); //get by id
router.get(
  '/v1/getExpenseCategoryByCompanyId/:id',
  expensecategoryController.getexpenseCategoryByCompanyId
); //get by id
router.get(
  '/v1/getactiveExpenseCategorybycompanyid/:id',
  expensecategoryController.getactiveexpensecategorybycompanyid
);
router.post(
  '/v1/uploadexcel',
  uploadfile,
  expensecategoryController.uploadexcel
); //upload excel

router.post('/v1/validateExcel', uploadfile, expensecategoryController.validateUploadExcel);

router.post('/v1/reValidateExpenceCategory', expensecategoryController.reValidateExpenceCategory);

router.post('/v1/addValidateExpenseCategory', expensecategoryController.addValidateExpenseCategory)

module.exports = router;
