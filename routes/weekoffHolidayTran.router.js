const express = require('express');
const weekoffHolidayTranController = require('../controllers/weekoffHolidayTran.controller');
const router = express.Router();

router.get(
  '/v1/add_weekoff/:yearMonth',
  weekoffHolidayTranController.getAddweekoffTran
); // save data
router.get(
  '/v1/add_holiday/:yearMonth',
  weekoffHolidayTranController.getAddHolidayTran
); // save data

module.exports = router;
