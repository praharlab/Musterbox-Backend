const express = require('express');
const attendancePolicyController = require('../controllers/attendancepolicy.controller');
const router = express.Router();

router.post('/v1/add', attendancePolicyController.postAddAttendancePolicy); // save data
router.post(
  '/v1/getalldata',
  attendancePolicyController.getAllAttendancePolicyData
); //get all attendancePolicy data
router.get(
  '/v1/getbyid/:id',
  attendancePolicyController.getAttendancePolicyById
); //get by id
router.post(
  '/v1/updatebyid',
  attendancePolicyController.postUpdateAttendancePolicy
); //update attendancePolicy data
router.post(
  '/v1/deletebyid',
  attendancePolicyController.postDeleteAttendancePolicyById
); //delete by id
router.post('/v1/statuschange', attendancePolicyController.poststatuschange); //status
router.get(
  '/v1/getactiveattendancepolicybycompanyid/:id',
  attendancePolicyController.getactiveattendancebycompanyid
);

module.exports = router;
