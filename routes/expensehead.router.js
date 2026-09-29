const express = require('express');
const expenseheadController = require('../controllers/expensehead.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', expenseheadController.postAddexpenseHead); // save data
router.post('/v1/getalldata', expenseheadController.getAllexpenseHead); //get all companytype tax data
router.get('/v1/getbyid/:id', expenseheadController.getexpenseHeadId); //get by id
router.post('/v1/updatebyid', expenseheadController.postUpdateexpenseHead); //update companytype tax data
router.post('/v1/deletebyid', expenseheadController.postDeleteexpenseHeadById); //delete by id
router.post('/v1/statuschanges', expenseheadController.poststatuschange); //status by id
router.post(
  '/v1/getExpenseHeadcompanyid',
  expenseheadController.getexpenseHeadcompanyid
); //get by id
router.get(
  '/v1/getExpenseHeadByCompanyId/:id',
  expenseheadController.getexpenseHeadByCompanyId
); //get by id
router.get(
  '/v1/getactiveExpenseHeadbycompanyid/:id',
  expenseheadController.getactiveexpenseheadbycompanyid
);
router.get(
  '/v1/getactiveexpenseheadbycategoryid/:id',
  expenseheadController.getactiveexpenseheadbycategoryid
);

router.post('/v1/excel1', expenseheadController.excel1);
router.post('/v1/uploadexcel', uploadfile, expenseheadController.uploadexcel); //upload excel
router.post(
  '/v1/getExpenseCategoriesForSelectedCompany',
  expenseheadController.getExpenseCategoriesForSelectedCompany
); //get expense category by company id

router.post('/v1/validateExcel', uploadfile, expenseheadController.validateUploadExcel);

router.post('/v1/revalidateExpensehead', expenseheadController.revalidateExpensehead);

router.post('/v1/addValidateExpensehead', expenseheadController.addValidateExpensehead);

router.post('/v1/generateDemoExcel', expenseheadController.generateDemoExcel);
module.exports = router;
