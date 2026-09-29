const express = require('express');
const UserLeaveTransaction = require('../controllers/userLeaveTransaction.controller');
const router = express.Router();


router.post(
  '/v1/getApprovedLeaveTransactionByUser',
  UserLeaveTransaction.getApprovedLeaveTransactionByUser
);
module.exports = router;
