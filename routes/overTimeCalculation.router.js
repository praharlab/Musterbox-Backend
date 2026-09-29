const express = require('express');
const overTimeCalculationController = require('../controllers/overTimeCalculation.controller');
const router = express.Router();
router.post(
  '/v1/calculateOvertime',
  overTimeCalculationController.calculateOvertime
);

router.post(
  '/v1/editOvertimeCalculation',
  overTimeCalculationController.editOvertimeCal
);

router.post(
  '/v1/getdataovertime',
  overTimeCalculationController.getdataovertime
);

router.post(
  '/v1/getPendingOvertimedata',
  overTimeCalculationController.getPendingOvertimedata
);
router.post(
  '/v1/getratiowiseovertime',
  overTimeCalculationController.getratiowiseovertime
);
router.post(
  '/v1/editovertimecal',
  overTimeCalculationController.editovertimecal
);
router.post(
  '/v1/deleteovertimecal',
  overTimeCalculationController.deleteovertimecal
);
router.post(
  '/v1/getovertimereport',
  overTimeCalculationController.getovertimereport
);
router.post(
  '/v1/getOvertimeDataUserwise',
  overTimeCalculationController.getOvertimeDataUserwise
);

router.post(
  '/v1/consolidateReport',
  overTimeCalculationController.getConsolidateReport
);

router.post(
  '/v1/getDailyOTReport',
  overTimeCalculationController.getDailyOTReport
);

module.exports = router;
