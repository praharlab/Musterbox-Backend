const express = require('express');
const hrLeaveBalance = require('../controllers/hrLeaveBalance.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', hrLeaveBalance.postBulkAddLeave); //add and save the data for Hr leave Bal
router.get('/v1/user/:id', hrLeaveBalance.getUserLeaveBal); //get HrLeaveBalance by User master Id
router.post('/v1/update', hrLeaveBalance.postUpdateLeaveBal); // update HLeaveBalance
router.post('/v1/addLeaveBalance', hrLeaveBalance.automaticAddLeaveBalance); // automaticAddLeaveBalance HLeaveBalance
router.get('/v1/getLeavesAddedById/:id', hrLeaveBalance.getLeavesAddedById); // automaticAddLeaveBalance HLeaveBalance

router.post('/v1/addHrLeaveBalance', hrLeaveBalance.addHrLeaveBalance); // Add PL Balance for Mars
router.post(
  '/v1/exportLeaveOpeningBalance',
  hrLeaveBalance.exportLeaveOpeningBalance
); // Export Leave Balance

router.post(
  '/v1/validateExcel',
  uploadfile,
  hrLeaveBalance.validateUploadExcel
);

router.post('/v1/addLeaveOpeningBalance', hrLeaveBalance.addLeaveOpeningBalance);
router.post('/v1/getAddedLeaveBalanceByUser', hrLeaveBalance.getAddedLeaveBalanceByUser);

module.exports = router;
