const express = require('express');
const officeExpenseCategoryController = require('../controllers/officeExpenseCategory.controller');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.post('/v1/postAddOfficeExpenseCategory', officeExpenseCategoryController.postAddOfficeExpenseCategory);
router.post('/v1/getAllOfficeExpenseCategory', officeExpenseCategoryController.getAllOfficeExpenseCategory);
router.put('/v1/updateOfficeExpenseCategory', officeExpenseCategoryController.updateOfficeExpenseCategory);
router.delete('/v1/deleteOfficeExpenseCategory/:id', officeExpenseCategoryController.deleteOfficeExpenseCategory);
router.get('/v1/getOfficeExpenseCategoryByID/:id', officeExpenseCategoryController.getOfficeExpenseCategoryByID);
router.get('/v1/generateDemoExcelForOfficeExpenseCategory', officeExpenseCategoryController.generateDemoExcelForOfficeExpenseCategory);
router.post('/v1/validateExcel', uploadfile, officeExpenseCategoryController.validateUploadExcel);
router.post('/v1/reValidateOfficeExpenceCategory', officeExpenseCategoryController.reValidateOfficeExpenceCategory);
router.post('/v1/addValidateOfficeExpenseCategory', officeExpenseCategoryController.addValidateOfficeExpenseCategory)
router.post('/v1/postStatusChange', officeExpenseCategoryController.postStatusChange)

module.exports = router;