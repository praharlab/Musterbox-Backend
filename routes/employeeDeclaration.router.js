const express = require('express');
const EmployeeDeclarationController = require('../controllers/employeeDeclaration.controller');

const { uploadEmployeeDeclaration } = require('../middleware/upload');
const employeeDeclaration = require('../models/employeeDeclaration');
const router = express.Router();

router.post(
  '/v1/add',
  uploadEmployeeDeclaration,
  EmployeeDeclarationController.postAddDeclarationRequest
);
router.get(
  '/v1/getbyid/:id',
  EmployeeDeclarationController.getDeclarationRequestByID
);
router.post(
  '/v1/update',
  uploadEmployeeDeclaration,
  EmployeeDeclarationController.postUpdateDeclarationRequest
);
router.post(
  '/v1/delete',
  EmployeeDeclarationController.postDeleteDeclarationRequest
);
router.post('/v1/getAll', EmployeeDeclarationController.listDeclarationRequest);
router.post(
  '/v1/acceptReject',
  EmployeeDeclarationController.acceptRejectDeclarationRequest
);
router.get('/v1/getByUserId', EmployeeDeclarationController.getByUserId);
router.get(
  '/v1/getDeclarationDatailsByUserId',
  EmployeeDeclarationController.getDeclarationDatailsByUserId
);

router.get(
  '/v1/getYearlyIncometaxCalculationByUserId',
  EmployeeDeclarationController.getYearlyIncometaxCalculationByUserId
);
router.get(
  '/v1/getFinancialYear',
  EmployeeDeclarationController.getFinancialYear
);

router.get(
  '/v1/getMonthlyTaxDeductionsOfEmployees',
  EmployeeDeclarationController.getMonthlyTaxDeductionsOfEmployees
);
router.post(
  '/v1/addManualInxomeTaxAmount',
  EmployeeDeclarationController.addManualInxomeTaxAmount
);
router.post(
  '/v1/deleteManualAmount',
  EmployeeDeclarationController.deleteManualAmount
);

router.get(
  '/v1/getIncomeTaxComputation',
  EmployeeDeclarationController.getIncomeTaxComputation
);

router.post(
  '/v1/getEmployeeDeclarationReport',
  EmployeeDeclarationController.getEmployeeDeclarationReport
);

module.exports = router;
