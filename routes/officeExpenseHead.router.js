const express = require('express');
const officeExpenseHeadController = require('../controllers/officeExpenseHead.controller');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.post('/v1/postAddOfficeExpenseHead', officeExpenseHeadController.postAddOfficeExpenseHead);
router.post('/v1/getAllOfficeExpenseHead', officeExpenseHeadController.getAllOfficeExpenseHead);
router.put('/v1/updateOfficeExpenseHead', officeExpenseHeadController.updateOfficeExpenseHead);
router.delete('/v1/deleteOfficeExpenseHead/:id', officeExpenseHeadController.deleteOfficeExpenseHead);
router.get('/v1/getOfficeExpenseHeadByID/:id', officeExpenseHeadController.getOfficeExpenseHeadByID);
router.post('/v1/generateDemoExcelForOfficeExpenseHead', officeExpenseHeadController.generateDemoExcelForOfficeExpenseHead);
router.post('/v1/validateExcel', uploadfile, officeExpenseHeadController.validateUploadExcel);
router.post('/v1/revalidateOfficeExpensehead', officeExpenseHeadController.revalidateOfficeExpensehead);
router.post('/v1/addValidateOfficeExpensehead', officeExpenseHeadController.addValidateOfficeExpensehead);
router.post('/v1/postStatusChange', officeExpenseHeadController.postStatusChange);


module.exports = router;