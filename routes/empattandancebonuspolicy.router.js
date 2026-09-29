const express = require('express');
const employeeAttendanceBonusPolicyController = require('../controllers/empattandancebonuspolicy.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const router = express.Router();

router.get(
  '/v1/getbyuserid/:id',
  employeeAttendanceBonusPolicyController.getEmployeeAttendanceBonuByUserId
);

router.post(
  '/v1/getbulk',
  verifyChildParent,
  employeeAttendanceBonusPolicyController.getAttendanceBonusPolicyoff
); //status changeget
router.post(
  '/v1/addbulk',
  employeeAttendanceBonusPolicyController.postAddattendanceBonusBULK
); // save data

module.exports = router;
