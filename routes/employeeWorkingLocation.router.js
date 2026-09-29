const express = require('express');
const employeeWorkingLocationController = require('../controllers/employeeWorkingLocation.controller');
const router = express.Router();

router.post(
  '/v1/add',
  employeeWorkingLocationController.postAddEmployeeWorkingLocation
); // save data
router.get(
  '/v1/getbyuserid/:id',
  employeeWorkingLocationController.getEmployeeWorkingLocationByUserId
); // get data
router.post(
  '/v1/deletebyid',
  employeeWorkingLocationController.postDeleteEmployeeWorkingLocationById
); // delete data
router.post(
  '/v1/getEmployeeWorkingLocation',
  employeeWorkingLocationController.getEmployeeWorkingLocation
); // employee EmployeeWorkingLocationRoutes data
router.post(
  '/v1/addbulk',
  employeeWorkingLocationController.postAddEmployeeWorkingLocationBULK
); // add bulk data

module.exports = router;
