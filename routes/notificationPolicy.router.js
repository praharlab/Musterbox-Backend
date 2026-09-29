const express = require('express');
const notificationPolicy = require('../controllers/notificationPolicy.controller');
const router = express.Router();

router.post('/v1/add', notificationPolicy.postAddNotificationPolicy); //save the data
router.get(
  '/v1/getNotificationPolicyDataByCompanyId/:id',
  notificationPolicy.getNotificationPolicyDataByCompanyId
); //get by id

router.post('/v1/TestEmail', notificationPolicy.TestEmail); //save the data

module.exports = router;
