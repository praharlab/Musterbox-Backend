const express = require('express');
const UserLapseLeaveController = require('../controllers/userLeaveLapse.controller');
const router = express.Router();


router.post(
  '/v1/getLeaveLapseByUser',
  UserLapseLeaveController.getLeaveLapseByUser
);


module.exports = router;
