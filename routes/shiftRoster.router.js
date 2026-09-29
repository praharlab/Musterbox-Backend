const express = require("express");
const router = express.Router();
const ShiftRosterController = require("../controllers/shiftRoster.controller");
const { uploadfile } = require('../middleware/upload');

router.post("/v1/addShiftRoster", ShiftRosterController.addShiftRoster);

router.post("/v1/updateShiftRoster", ShiftRosterController.updateShiftRoster);
router.post(
  "/v1/listShiftRosterData",
  ShiftRosterController.listShiftRosterData
);

router.post(
  "/v1/exportDemoShiftRoster",
  ShiftRosterController.exportDemoShiftRoster
);
router.post(
  "/v1/validateExcel",
  uploadfile,
  ShiftRosterController.validateUploadExcel
);
router.post(
  '/v1/revalidateShiftRoster',
  ShiftRosterController.revalidateShiftRoster
);

router.post(
  '/v1/addValidateShiftRoster',
  ShiftRosterController.addValidateShiftRoster
);
module.exports = router;
