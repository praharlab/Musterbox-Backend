const express = require('express');
const expensePaymentController = require('../controllers/expensePayment.controller');
const router = express.Router();
const { uploadfile } = require("../middleware/upload");
router.post(
  '/v1/expensePaymentData',
  expensePaymentController.expensePaymentData
);
router.post('/v1/add', expensePaymentController.AddExpensePayment);
router.get(
  '/v1/expensePaymentDetailsByTranId/:id',
  expensePaymentController.expensePaymentDetailsByTranId
);
router.post('/v1/listPaidExpense', expensePaymentController.listPaidExpense);
router.post('/v2/listPaidExpense', expensePaymentController.listPaidExpense_v2);
router.post('/v1/delete', expensePaymentController.deletePaidExpesne);
router.get(
  '/v1/getByexpensePaymentId/:id',
  expensePaymentController.getByexpensePaymentId
);
router.post('/v1/updatebyid', expensePaymentController.postUpdatePaidExpense);

router.post('/v1/getdata', expensePaymentController.getadvanceexpense);

router.post('/v1/adddata', expensePaymentController.addadvanceexpense);

router.post('/v1/getById/:id', expensePaymentController.getById);

router.post('/v1/edit/:id', expensePaymentController.postUpdateadvanceexpense);

router.delete('/v1/delete/:id', expensePaymentController.deleteip);

router.post('/v1/docNo', expensePaymentController.storeDocNo);

router.post(
  '/v1/synerpIntegration/:id',
  expensePaymentController.synerpIntegration
);

router.post(
  '/v1/syncerpExpensePayment',
  expensePaymentController.syncerpExpensePayment
);
router.post(
  '/v1/exportDemoImportGroupExpense',
  expensePaymentController.exportDemoImportGroupExpense
);
router.post(
  "/v1/validateExcel",
  uploadfile,
  expensePaymentController.validateUploadExcel
);
router.post(
  "/v1/reValidateUploadExcel",
  expensePaymentController.reValidateUploadExcel
);
router.post(
  "/v1/addValidateExpensePayment",
  expensePaymentController.addValidateExpensePayment
);
module.exports = router;
