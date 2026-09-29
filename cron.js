// var cron = require('node-cron');
// const employeeDepartmentController = require('./controllers/employeedepartment.controller');
// const employeeDesignationController = require('./controllers/employeedesignation.controller');
// const employeeBranchController = require('./controllers/employeedesignation.controller');
// const employeeHolidayPolicyController = require('./controllers/employeeHolidayPolicy.controller');
// const expensepriceController = require('./controllers/expenseprice.controller');

// cron.schedule('1 0 * * *', () => {
//   console.log('running a task at 12:01 midnight', new Date());
//   employeeDepartmentController.changeStatusByDate();
//   employeeDesignationController.changeStatusByDate();
//   employeeBranchController.changeStatusByDate();
//  employeeHolidayPolicyController.changeStatusByDate();
//   expensepriceController.changeStatusByDate();
// });

const cron = require('node-cron');
const expenseController = require('./controllers/userExpense.controller');
const joiningDocumentController = require('./controllers/joiningDocument.controller');
require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  console.log('Cron set Successfully', new Date());
  cron.schedule('10 15 * * *', () => {
    console.log('Auto ERP sync task at 13:05 Noon', new Date());
    expenseController.erpExpenseAutoSync();
  });
}

/**
 * DO NOT REMOVE
 * Cron set for PIH
 * */
// if (process.env.NODE_ENV === 'production') {
//     console.log('Cron set Successfully', new Date());
//     //   cron.schedule('5 0 * * *', () => {
//     //     console.log('Auto ERP sync task at 12:05 midnight', new Date());
//     //     expenseController.erpExpenseAutoSync();
//     //   });

//     /**Joining document expiry email cron */
//     cron.schedule('5 0 * * *', () => {
//         console.log('Joining document expiry email cron', new Date());
//         joiningDocumentController.expiryJoiningCron();
//     });
// }
