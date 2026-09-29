const express = require('express');
const reportController = require('../controllers/report.controller');
const router = express.Router();

const {
  uploadfile,
  uploaduserphoto,
  faceUpload,
} = require('../middleware/upload');

router.post('/v1/pfreport', reportController.pfreport);
router.post('/v1/esicchallan', reportController.esicchallan);
router.post('/v1/hrattendancereport', reportController.hrattendancereport);
router.post(
  '/v1/hrattendancewithsalaryreport',
  reportController.hrattendancewithsalaryreport
);
router.post('/v1/visitReport', reportController.visitReport);
router.post('/v1/visitSummaryReport', reportController.visitSummaryReport);
router.post('/v1/loanReport', reportController.getLoanreportData);
router.post('/v1/employeedetails', reportController.employeedetails);
router.post('/v1/adultemployees', reportController.adultemployees);
router.post('/v1/form18', reportController.form18);
router.post('/v1/tracking_report', reportController.tracking_report);
router.post('/v1/form14', reportController.form14);
router.post('/v1/increment_report', reportController.increment_report);
router.post('/v1/leavebalance_report', reportController.leavebalance_report);
router.post('/v1/formEr01', reportController.formEr01);
router.post('/v1/ESIC', reportController.Esicdata);
router.post('/v1/form_11', reportController.Form11);

router.post('/v1/salaryRegister', reportController.salaryRegister);

router.post('/v1/esicreport', reportController.esic);
router.post('/v1/pfreport1', reportController.pfreport1);
router.post('/v1/form_29', reportController.Form29);

router.post(
  '/v1/visitReportByCustomer',
  reportController.visitReportByCustomer
);
router.post(
  '/v1/wagesofsalaryregister',
  reportController.wagesofsalaryregister
);

router.post('/v1/paMusterRoll', reportController.paMusterRoll);
router.post(
  '/v1/inoutAttendanceRegister',
  reportController.inoutAttendanceRegister
);

router.post('/v1/form_5', reportController.Form5);
router.post('/v1/hourlySalaryRegister', reportController.hourlySalaryRegister);
router.post('/v1/lwf_report', reportController.Lwf_report);
router.post('/v1/leaveReport', reportController.leaveReport);

router.post('/v1/getDashboardSalary', reportController.getDashboardSalary);
router.post('/v1/expense-report', reportController.expenseReport);

router.post('/v1/uploadexcel', uploadfile, reportController.uploadexcel);

router.post('/v1/getTrackingReports', reportController.getTrackingReports);

router.post(
  '/v1/getleaveBalanceReport',
  reportController.getleaveBalanceReport
);

router.post('/v1/bankStatementReport', reportController.bankStatementReport);

router.post(
  '/v1/distinctLoationsTrackingReport',
  reportController.distinctLoationsTrackingReport
);

router.post(
  '/v1/fiveMinuteGapTrackingReport',
  reportController.fiveMinuteGapTrackingReport
);

router.post('/v1/getreportsToreport', reportController.getreportsToreport);

router.post('/v1/getTaleAttreport', reportController.getTaleAttreport);

router.post('/v1/dailyInOutReport', reportController.dailyInOutReport);

// add gratuity to all company

router.post('/v1/addGratuity', reportController.addGratuity);

router.post(
  '/v1/monthlyAttendanceReport',
  reportController.monthlyAttendanceReport
);
router.post(
  '/v1/employeeWiseSalaryReport',
  reportController.employeeWiseSalaryReport
);

router.post('/v1/form16Report', reportController.form16Report);
router.get(
  '/v1/getPreviousfinancialYear',
  reportController.getPreviousfinancialYear
);

router.get(
  '/v1/shiftwiseattendancecount',
  reportController.shiftwiseattendancecount
);

router.post('/v1/loanreportData', reportController.loanReport);

router.get(
  '/v1/shiftdepartmentwiseDailyattendancecount',
  reportController.shiftDepartmentWiseDailyAttendanceCount
);

router.post(
  '/v1/userDocumentExpriyData',
  reportController.UserDocumentExpriyReport
);

router.post('/v1/attendanceRegister3', reportController.attendanceRegister3);

router.post('/v1/attendanceReport4', reportController.attendanceReport4);

// router.post(
//   '/v1/changeEsicValueAsopalav',
//   reportController.changeEsicValueAsopalav
// );

router.post(
  '/v1/getWeekoffDayWorkReport',
  reportController.getWeekoffDayWorkReport
);

//--------------------------Slot Wise Attendance Report --------------------------------------

router.post(
  '/v1/slotwiseAttendanceReport',
  reportController.slotwiseAttendanceReport
);

router.post('/v1/addweekoff', reportController.addweekoff);

router.post(
  '/v1/shortLeaveApplicationReport',
  reportController.shortLeaveApplicationReport
);

router.get('/v1/lwfChallan', reportController.lwfChallan);

router.post('/v1/serviceChargesBill', reportController.serviceChargesBill);

router.post('/v1/labourChargesBill', reportController.labourChargesBill);

router.post(
  '/v1/employeeWiseSalaryReport_new',
  reportController.employeeWiseSalaryReport_new
);

router.post('/v1/otReportWithESIC', reportController.otReportWithESIC);

router.post('/v1/salarySummary', reportController.salarySummary);

router.post('/v1/employeeBonusReport', reportController.employeeBonusReport);

router.post('/v1/PT_register', reportController.PT_register);

router.post('/v1/attendance_dashboard', reportController.attendance_dashboard);

router.post(
  '/v1/attendanceCorrectionReport',
  reportController.attendanceCorrectionReport
);

router.post('/v1/expenseClaimReport', reportController.expenseClaimReport);

router.post('/v1/marsExpenseReport', reportController.marsExpenseReport);
router.post('/v1/completedTenureReport', reportController.completedTenureReport);
router.post('/v1/officeExpenseReport', reportController.officeExpenseReport);

module.exports = router;
