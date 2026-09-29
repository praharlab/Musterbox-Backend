const express = require('express');
const employeeLateEarlyController = require('../controllers/employeeLateEarlyPolicy.controller');
const router = express.Router();

router.post('/v1/add', employeeLateEarlyController.postAddLateEarlyPolicy); // save data
router.get(
  '/v1/getbyuserid/:id',
  employeeLateEarlyController.getLateEarlyPolicyByUserId
); // get data
router.post(
  '/v1/updatebyid',
  employeeLateEarlyController.postUpdateLateEarlyPolicy
); // edit data
router.post(
  '/v1/deletebyid',
  employeeLateEarlyController.postDeletLateEarlyPolicyById
); // delete data
router.post(
  '/v1/getLateEarlyPolicy',
  employeeLateEarlyController.getLateEarlyPolicy
); // employee  data
router.post(
  '/v1/postAddAllPolicyBULK',
  employeeLateEarlyController.postAddAllPolicyBULK
); // add bulk data

module.exports = router;
