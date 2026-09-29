const express = require('express');
const officeExpenseController = require('../controllers/officeExpense.controller');
const { handleMulterErrors, configureMulter } = require('../middleware/multer');
const router = express.Router();
const path = require("path");

const multerMiddleware = configureMulter(
  path.join(__dirname, "../uploads/office-expense"),
  1024 * 1024 * 10,
  ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
);

router.post('/v1/addOfficeExpense', multerMiddleware.array("attachFile", 40), handleMulterErrors, officeExpenseController.addOfficeExpense);
router.post('/v1/getAllOfficeExpense', officeExpenseController.getAllOfficeExpense);
router.post('/v1/getOfficeExpenseByID', officeExpenseController.getOfficeExpenseByID);
router.post('/v1/updateOfficeExpense', multerMiddleware.array("attachFile", 40), handleMulterErrors, officeExpenseController.updateOfficeExpense);
router.delete('/v1/deleteOfficeExpense/:id', officeExpenseController.deleteOfficeExpense);
router.post('/v1/exportOfficeExpense', officeExpenseController.exportOfficeExpense);
router.get('/v1/getOfficeExpenseTransactionByID/:id', officeExpenseController.getTransactionByID);
router.post('/v1/reapply', multerMiddleware.array("attachFile", 40), handleMulterErrors, officeExpenseController.reapplyOfficeExpense);

module.exports = router;