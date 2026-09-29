const express = require('express');
const employeeHolidayPolicyController = require('../controllers/employeeHolidayPolicy.controller');
const router = express.Router();

router.post(
  '/v1/add',
  employeeHolidayPolicyController.postAddEmployeeHolidayPolicy
); // save data
router.post(
  '/v1/getalldata',
  employeeHolidayPolicyController.getAllEmployeeHolidayPolicyData
); //get all emplyee designation data
router.get(
  '/v1/getbyid/:id',
  employeeHolidayPolicyController.getEmployeeHolidayPolicyById
); //get by id
router.get(
  '/v1/getbyuserid/:id',
  employeeHolidayPolicyController.getEmployeeHolidayPolicyByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  employeeHolidayPolicyController.postUpdateEmployeeHolidayPolicy
); //update emplyee designation data
router.post(
  '/v1/deletebyid',
  employeeHolidayPolicyController.postDeleteEmployeeHolidayPolicyById
); //delete by id
router.post(
  '/v1/statuschanges',
  employeeHolidayPolicyController.poststatuschange
); //status change
router.post(
  '/v1/getEmployeeHoliday',
  employeeHolidayPolicyController.getEmployeeHoliday
); //status changeget
router.post(
  '/v1/addbulk',
  employeeHolidayPolicyController.postAddEmployeeWeekoffBULK
); // save data
module.exports = router;
