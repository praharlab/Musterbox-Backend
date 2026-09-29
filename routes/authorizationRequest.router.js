const express = require('express');
const authorizationRequestController = require('../controllers/authorizationRequest.controller');
const router = express.Router();

router.post(
  '/v1/getbyuserid',
  authorizationRequestController.viewauthorizationrequestbyuserid
); // show data
router.post(
  '/v1/authorizationacceptreject',
  authorizationRequestController.authorizationacceptreject
); // Acccept Reject data
router.get('/v1/checkapi', authorizationRequestController.checkapi);
router.post(
  '/v1/expenseauthorizationrequestbyuserid',
  authorizationRequestController.viewauthorizationrequestbyuseridforexpense
);
router.post(
  '/v1/expenseauthorizationrequestbyuserid1',
  authorizationRequestController.viewauthorizationrequestbyuseridforexpense1
);
router.get(
  '/v1/getAuthorizationRequestByReferanceIdExpense/:id',
  authorizationRequestController.getAuthorizationRequestByReferanceIdExpense
);

router.post(
  '/v1/viewauthorizationrequestbyuseridforovertime',
  authorizationRequestController.viewauthorizationrequestbyuseridforovertime
);
router.get(
  '/v1/getAuthorizationRequestByReferanceIdOvertime/:id',
  authorizationRequestController.getAuthorizationRequestByReferanceIdOvertime
);
router.post(
  '/v1/authorizationacceptrejectovertime',
  authorizationRequestController.authorizationacceptrejectovertime
);
// router.post('/v1/expenseauthorizationrequestbyuserid1', authorizationRequestController.viewauthorizationrequestbyuseridforexpense1);
router.get(
  '/v1/getauthrequestdata/:id',
  authorizationRequestController.getauthrequestdata
);
router.post('/v1/checkfcm', authorizationRequestController.checkfcm);
router.get(
  '/v1/OvertimeAuthCriteria/:id',
  authorizationRequestController.overtimeAuthCriteria
);
router.post(
  '/v1/overtimeAuthoriedUser',
  authorizationRequestController.overtimeAuthoriedUser
);
router.post(
  '/v1/authorizationacceptrejectexpenseall',
  authorizationRequestController.authorizationacceptrejectexpenseall
);

router.post(
  '/v1/overtimedatashow',
  authorizationRequestController.overtimedatashow
);

router.post(
  '/v1/expensedatashow',
  authorizationRequestController.expensedatashow
);

router.get(
  '/v1/getExpenseAuthorizationRequestByAuthorizationRequestId/:id',
  authorizationRequestController.getExpenseAuthorizationRequestByAuthorizationRequestId
);

router.post(
  '/v1/getExpenseAuthByUserExpenseTrans',
  authorizationRequestController.getExpenseAuthByUserExpenseTrans
);
router.post(
  '/v3/getExpenseAuthByUser',
  authorizationRequestController.getExpenseAuthByUserExpense
);
module.exports = router;
