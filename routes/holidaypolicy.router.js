const express = require('express');
const holidayPolicyController = require('../controllers/holidaypolicy.controller');
const router = express.Router();

router.post('/v1/add', holidayPolicyController.postAddholidayPolicy); // save data
router.post('/v1/getalldata', holidayPolicyController.getAllholidayPolicyData); //get all week off data
router.get('/v1/getbyid/:id', holidayPolicyController.getholidayPolicyById); //get by id
router.post(
  '/v1/getbycompanyid',
  holidayPolicyController.getholidayPolicyByCompanyId
); //get by company id
router.post('/v1/updatebyid', holidayPolicyController.postUpdateholidayPolicy); //update week off data
router.post(
  '/v1/deletebyid',
  holidayPolicyController.postDeleteholidayPolicyById
); //delete by id
router.post('/v1/statuschanges', holidayPolicyController.poststatuschange); //status change
router.get(
  '/v1/getactiveholidaypolicybycompanyid/:id',
  holidayPolicyController.getactiveholidaypolicybycompanyid
);

module.exports = router;
