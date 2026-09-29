const express = require('express');
const employeeSalaryPolicyController = require('../controllers/employeesalarypolicycontroller');
const router = express.Router();

router.post('/v1/add', employeeSalaryPolicyController.postAddSalaryPolicy); // save data
router.get(
  '/v1/getbyuserid/:id',
  employeeSalaryPolicyController.getSalaryPolicyByUserId
); // get data
router.get(
  '/v1/getbyid/:id',
  employeeSalaryPolicyController.getSalaryPolicyById
); //get by id
router.post(
  '/v1/updatebyid',
  employeeSalaryPolicyController.postUpdateSalaryPolicy
); // edit data
router.post(
  '/v1/deletebyid',
  employeeSalaryPolicyController.postDeletSalaryPolicyById
); // delete data
router.post(
  '/v1/getSalaryPolicy',
  employeeSalaryPolicyController.getSalaryPolicy
); // employee shift data
router.post(
  '/v1/addbulk',
  employeeSalaryPolicyController.postAddSalaryPolicyBULK
); // add bulk data
router.post(
  '/v1/getActive',
  employeeSalaryPolicyController.getActiveSalaryPolicy
); // get active policy data

router.post(
  '/v1/getUserBySalaryPolicy',
  employeeSalaryPolicyController.getUserBySalaryPolicy
); // get active policy data

module.exports = router;
