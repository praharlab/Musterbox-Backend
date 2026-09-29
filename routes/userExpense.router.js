const express = require('express');
const expenseController = require('../controllers/userExpense.controller');
const router = express.Router();
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/user-Expense'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

router.get('/v1/getbyid/:id', expenseController.getUserExpenseById); //get by id
router.post('/v1/getbyversion', expenseController.getUserExpenseByVersion);
router.post('/v1/updatebyid', expenseController.postUpdateUserExpense);
router.post('/v1/syncexpense', expenseController.syncexpense);
router.post('/v1/deleteUserExpenseTransaction', expenseController.deleteUserExpenseTransaction);
router.post('/v1/userExpenseNew', expenseController.userExpenseNew);
router.post(
  '/v1/updatebyauthorizationid',
  expenseController.postAuthorizationUpdateUserExpense
);
router.get(
  '/v1/userExpenseAuthDetails/:id',
  expenseController.ExpenseAuthorizationDetails
);
router.get('/v1/erpExpenseAutoSync', expenseController.erpExpenseAutoSync);
router.post('/v2/expensesyncdata', expenseController.expenseSyncData_V2);
router.post(
  '/v1/findExpesneWithNegativeJvID',
  expenseController.findExpesneWithNegativeJvID
);
router.post(
  '/v1/findExpesneWithUnassignedERPID',
  expenseController.findExpesneWithUnassignedERPID
);

router.post(
  '/v2/add',
  multerMiddleware.array('attachFile', 40),
  handleMulterErrors,
  expenseController.postAddUserExpense_V2
); // save data

router.post('/v2/userExpenseNew', expenseController.userExpenseNew_V2);

router.post(
  '/v2/reapply',
  multerMiddleware.array('attachFile', 40),
  handleMulterErrors,
  expenseController.reapply_V2
);
router.post('/v1/updateDatabaseImage', expenseController.updateDatabaseImage);

router.post('/v3/userExpenseNew', expenseController.userExpenseNew_V3);
router.post('/v1/userExpenseByID', expenseController.userExpenseByID);

router.post(
  '/v1/updatebyUserExpenseID',
  multerMiddleware.array('attachFile', 40),
  handleMulterErrors,
  expenseController.updatebyUserExpenseID
);
router.post(
  '/v1/deleteUserExpenseByExpenseID',
  expenseController.deleteUserExpenseByExpenseID
);
router.post('/v1/exportMyExpense', expenseController.exportMyExpense);

module.exports = router;
