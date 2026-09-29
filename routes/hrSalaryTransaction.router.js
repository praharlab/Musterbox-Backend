/** @format */

const express = require('express');
const hrSalaryTransaction = require('../controllers/hrSalaryTransaction.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', hrSalaryTransaction.GenrateSalary); // save data
router.post('/v1/deletesalary', hrSalaryTransaction.deletesalary); // delete data
router.post(
  '/v1/salaryslipuserwise',
  hrSalaryTransaction.getsalaryslipuserwise
); // delete data
router.post(
  '/v1/getUserWiseSalarySlip',
  hrSalaryTransaction.getUserWiseSalarySlip
);
// router.post('/v1/hrsalaryregister', hrSalaryTransaction.hrsalaryregister);
router.post(
  '/v1/monthlyhrsalaryregister',
  hrSalaryTransaction.monthlyhrsalaryregister
);
router.post('/v1/salarysummaryreport', hrSalaryTransaction.salarysummaryreport);
router.post('/v1/deleteAllsalary', hrSalaryTransaction.deleteAllsalary); // delete all salary
router.post('/v1/ctcmasterreport', hrSalaryTransaction.ctcmasterreport);
// adding extra fields
router.post(
  '/v1/addingOtherFieldsInGrade',
  hrSalaryTransaction.addingOtherFieldsInGrade
);
router.post('/v1/issueSalarySlip', hrSalaryTransaction.issueSalarySlip);
router.get(
  '/v1/getVariableDemoExcel',
  hrSalaryTransaction.getVariableDemoExcel
);
router.post(
  '/v1/uploadVariablePayheadExcel',
  uploadfile,
  hrSalaryTransaction.uploadVariablePayheadExcel
);

router.post(
  '/v1/sendSalarySlipviamail',
  hrSalaryTransaction.sendSalarySlipviamail
);
router.get('/v1/getAllSalarySlip', hrSalaryTransaction.getAllSalarySlip);

router.post('/v2/ctcmasterreport', hrSalaryTransaction.ctcmasterreportNew);


// -------------------Don't call these API'S-----------------------------

router.post(
  '/v1/add_CTC_Gross_Net_In_CompanyandGrade',
  hrSalaryTransaction.add_CTC_Gross_Net_In_CompanyandGrade
);
router.post(
  '/v1/add_CTC_Gross_Net_In_structure',
  hrSalaryTransaction.add_CTC_Gross_Net_In_structure
);
router.post(
  '/v1/add_CTC_Gross_Net_In_salary',
  hrSalaryTransaction.add_CTC_Gross_Net_In_salary
);

// ------------------ For add Default Payhead in company , gradestructure and hrsalarymaster -----------------

router.post(
  '/v1/add_defaultPayhead_In_Company',
  hrSalaryTransaction.add_defaultPayhead_In_Company
);

router.post('/v1/set_EDLIlimit', hrSalaryTransaction.set_EDLIlimit);

router.post('/v1/addLCEGPenaltyData', hrSalaryTransaction.addLCEGPenaltyData);

// ---------------------------------Don't call these API'S-------------------------------

// -----------------------Paid Salary API ------------------------
router.post('/v1/paidSalary', hrSalaryTransaction.paidSalary);


module.exports = router;
