const express = require('express');
const router = express.Router();
const attendanceBonusPolicycontroller = require('../controllers/attendanceBonusPolicy.controller');

router.post(
  '/v1/add',
  attendanceBonusPolicycontroller.postAddAttendancePolicyBonus
); // save data

router.get('/v1/listdata', attendanceBonusPolicycontroller.listdata);

router.put('/v1/editdata/:id', attendanceBonusPolicycontroller.editdata);

router.delete('/v1/deletedata/:id', attendanceBonusPolicycontroller.deletedata);

router.get('/v1/getdata/:id', attendanceBonusPolicycontroller.getdata);

router.post(
  '/v1/poststatuschange',
  attendanceBonusPolicycontroller.poststatuschange
);
router.get(
  '/v1/getactivedata/:id',
  attendanceBonusPolicycontroller.getactivewattendancebonusbycompanyid
);

module.exports = router;
