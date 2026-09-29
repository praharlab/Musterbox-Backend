const express = require("express");
const employeeShiftController = require("../controllers/employeeshift.controller");
const router = express.Router();

router.get(
  "/v1/getbyuserid/:id",
  employeeShiftController.getEmployeeShiftByUserId
); // get data
router.post("/v1/updatebyid", employeeShiftController.postUpdateEmployeeShift); // edit data
router.post("/v1/deletebyid", employeeShiftController.deleteEmployeeShiftByID); // delete data
router.post("/v1/getEmployeeShift", employeeShiftController.getEmployeeShift); // employee shift data

router.post("/v2/add", employeeShiftController.postAddEmployeeShiftV2);
router.post("/v2/addbulk", employeeShiftController.postAddEmployeeShiftBULKV2);
router.post('/v1/getEmployeeShiftReport', employeeShiftController.getEmployeeShiftReport); //get unassigned shift employees

module.exports = router;
