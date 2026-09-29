const express = require('express');
const salaryPolicyController = require('../controllers/salarypolicy.controller');
const router = express.Router();

router.post('/v1/add', salaryPolicyController.postAddSalaryPolicy); // save data
router.post('/v1/getalldata', salaryPolicyController.getAllSalaryPolicyData); //get all salaryPolicy data
router.get('/v1/getbyid/:id', salaryPolicyController.getSalaryPolicyById); //get by id
router.post('/v1/updatebyid', salaryPolicyController.postUpdateSalaryPolicy); //update salaryPolicy data
router.post(
  '/v1/deletebyid',
  salaryPolicyController.postDeleteSalaryPolicyById
); //delete by id
router.post('/v1/statuschange', salaryPolicyController.poststatuschange); //status
router.get(
  '/v1/getactivesalarypolicybycompanyid/:id',
  salaryPolicyController.getactivesalarybycompanyid
);

module.exports = router;
