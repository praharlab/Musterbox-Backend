const express = require('express');
const leaveEncashmentController = require('../controllers/leaveEncashment.controller');
const router = express.Router();


router.post(
  '/v1/cancelLapseLeaveEncashment',
  leaveEncashmentController.cancelLapseLeaveEncashment
);

router.post(
  '/v1/getAllLeaveEncashment',
  leaveEncashmentController.getAllLeaveEncashment
);

router.post(
  '/v1/getLeaveEncashmentByUser',
  leaveEncashmentController.getLeaveEncashmentByUser
);
module.exports = router;
