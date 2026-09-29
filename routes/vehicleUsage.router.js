const express = require('express');
const vehicleUsageController = require('../controllers/vehicleUsage.controller');
const router = express.Router();

router.post(
  '/v1/getuserdailyvehicleusagereport',
  vehicleUsageController.getUserDailyVehicleUsageReport
);
router.post(
  '/v1/addStartingVehicleUsage',
  vehicleUsageController.addStartingVehicleUsage
);
router.post(
  '/v1/addEndingVehicleUsage',
  vehicleUsageController.addEndingVehicleUsage
);
router.post(
  '/v1/getVehicleUsageByCompanyId',
  vehicleUsageController.getVehicleUsageByCompanyId
);

module.exports = router;
