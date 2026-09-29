const express = require("express");
const EmployeeDiscrepancyLetter = require("../controllers/employeeDiscrepancyLetter.controller");
const router = express.Router();

router.post(
  "/v1/addEmployeeDiscrepancyLetter",
  EmployeeDiscrepancyLetter.addEmployeeDiscrepancyLetter
);
router.post(
  "/v1/getEmployeeDiscrepancyLetter",
  EmployeeDiscrepancyLetter.getEmployeeDiscrepancyLetter
);
router.post(
  "/v1/updateEmployeeDiscrepancyLetter",
  EmployeeDiscrepancyLetter.updateEmployeeDiscrepancyLetter
);
router.post(
  "/v1/deleteEmployeeDiscrepancyLetter",
  EmployeeDiscrepancyLetter.deleteEmployeeDiscrepancyLetter
);
router.post(
  "/v1/sendEmailDiscrepancyLetter",
  EmployeeDiscrepancyLetter.sendEmailDiscrepancyLetter
);

module.exports = router;
