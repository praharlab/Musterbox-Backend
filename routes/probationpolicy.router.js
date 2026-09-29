const express = require('express');
const probationPolicyController = require('../controllers/probationpolicy.controller');
const router = express.Router();

router.post('/v1/add', probationPolicyController.postAddProbationPolicy); // save data
router.post(
  '/v1/getalldata',
  probationPolicyController.getAllProbationPolicyData
); //get all probationPolicy data
router.get('/v1/getbyid/:id', probationPolicyController.getProbationPolicyById); //get by id
router.post(
  '/v1/updatebyid',
  probationPolicyController.postUpdateProbationPolicy
); //update probationPolicy data
router.post(
  '/v1/deletebyid',
  probationPolicyController.postDeleteProbationPolicyById
); //delete by id
router.post('/v1/statuschanges', probationPolicyController.poststatuschange); //status change
module.exports = router;
