const express = require('express');
const employeeShortLeavePolicy = require('../controllers/employeeShortLeavePolicy.controller');
const router = express.Router();

router.post('/v1/addData', employeeShortLeavePolicy.addData);
router.get(
  '/v1/getEmpShortLeavePolicyByUserId/:id',
  employeeShortLeavePolicy.getEmpLeavePolicyByUserId
);

router.post('/v1/getEmpShortLeavePolicyByCompany',employeeShortLeavePolicy.getEmpShortLeavePolicyByCompany);

router.post(
  '/v1/listUserShortLeaveForCancelShortLeave',
  employeeShortLeavePolicy.listUserShortLeaveForCancelShortLeave
);

router.post(
  '/v1/cancelShortLeave',
  employeeShortLeavePolicy.cancelShortLeave
);






module.exports = router;