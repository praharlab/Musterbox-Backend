const express = require('express');
const weekOffPolicyController = require('../controllers/weekoffpolicy.controller');
const router = express.Router();

router.post('/v1/add', weekOffPolicyController.postAddWeekOffPolicy); // save data
router.post('/v1/getalldata', weekOffPolicyController.getAllWeekOffPolicyData); //get all week off data
router.get('/v1/getbyid/:id', weekOffPolicyController.getWeekOffPolicyById); //get by id
router.post(
  '/v1/getbycompanyid',
  weekOffPolicyController.getWeekOffPolicyByCompanyId
); //get by company id
router.post('/v1/updatebyid', weekOffPolicyController.postUpdateWeekOffPolicy); //update week off data
router.post(
  '/v1/deletebyid',
  weekOffPolicyController.postDeleteWeekOffPolicyById
); //delete by id
router.post('/v1/statuschanges', weekOffPolicyController.poststatuschange); //status change
router.get(
  '/v1/getactiveweekoffbycompanyid/:id',
  weekOffPolicyController.getactiveweekoffbycompanyid
);

module.exports = router;
