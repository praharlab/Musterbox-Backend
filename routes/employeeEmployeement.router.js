const express = require('express');
const employeeEmployeementController = require('../controllers/employeeEmployeement.controller');
const router = express.Router();

router.post(
  '/v1/add',
  employeeEmployeementController.postAddEmployeeEmployeement
); // save data
router.post(
  '/v1/getalldata',
  employeeEmployeementController.getAllEmployeeEmployeement
); //get all employee Employeement data
router.get(
  '/v1/getbyid/:id',
  employeeEmployeementController.getEmployeeEmployeementById
); //get employeeEmployeement data by id
router.get(
  '/v1/getbyuserid/:id',
  employeeEmployeementController.getEmployeeEmployeementByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  employeeEmployeementController.postUpdateEmployeeEmployeement
); //get by user id
router.post(
  '/v1/deletebyid',
  employeeEmployeementController.postDeleteEmployeeEmployeementById
); //get by user id

router.post(
  '/v1/toBeConfirmedEmployee',
  employeeEmployeementController.toBeConfirmedEmployee
);

module.exports = router;
