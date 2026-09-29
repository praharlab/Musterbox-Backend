const express = require('express');
const employeeAttendancePolicyController = require('../controllers/employeeattendancepolicy.controller');
const router = express.Router();

router.post(
  '/v1/add',
  employeeAttendancePolicyController.postAddAttendancePolicy
); // save data
router.get(
  '/v1/getbyuserid/:id',
  employeeAttendancePolicyController.getAttendancePolicyByUserId
); // get data
router.get(
  '/v1/getbyid/:id',
  employeeAttendancePolicyController.getAttendancePolicyById
); //get by id
router.post(
  '/v1/updatebyid',
  employeeAttendancePolicyController.postUpdateAttendancePolicy
); // edit data
router.post(
  '/v1/deletebyid',
  employeeAttendancePolicyController.postDeletAttendancePolicyById
); // delete data
router.post(
  '/v1/getAttendancePolicy',
  employeeAttendancePolicyController.getAttendancePolicy
); // employee shift data
// add bulk data
router.post(
  '/v1/postAddAttendanceAllPolicyBULK',
  employeeAttendancePolicyController.postAddAllPolicyBULKATTENDANCE
); // add bulk data

module.exports = router;
