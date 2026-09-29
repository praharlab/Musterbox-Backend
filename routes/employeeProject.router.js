const express = require("express");
const EmployeeProjectController = require("../controllers/employeeProject.controller");
const { uploadfile } = require("../middleware/upload");
const router = express.Router();

router.post("/v1/assignProject", EmployeeProjectController.assignProject); // save data

router.post(
  "/v1/assignProjectBulk",
  EmployeeProjectController.assignProjectBulk
); // add bulk data

router.get(
  "/v1/getEmployeeProjectByuserMasterID",
  EmployeeProjectController.getEmployeeProjectByuserMasterID
); // get data

router.post(
  "/v1/deleteEmployeeProject",
  EmployeeProjectController.deleteEmployeeProject
); //delete by id


router.post('/v1/getEmployeeProjectByCompany',EmployeeProjectController.getEmployeeProjectByCompany);
router.post('/v1/getAllEmployeeProject',EmployeeProjectController.getAllEmployeeProject);

module.exports = router;
