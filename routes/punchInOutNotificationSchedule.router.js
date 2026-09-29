const express = require('express');
const {
  setupPunchInPunchoutCron,
} = require('../controllers/punchInOutNotificationSchedule.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');

const router = express.Router();
router.post('/v1/cron', verifyChildParent, setupPunchInPunchoutCron);
module.exports = router;
