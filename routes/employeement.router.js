const express = require('express');
const EmployeementController = require('../controllers/employeement.controller');
const router = express.Router();

router.post('/v1/add', EmployeementController.postAddEmployeement); // save data
router.post('/v1/getalldata', EmployeementController.getAllEmployeement); // get all data
router.get('/v1/getbyid/:id', EmployeementController.getEmployeementId); //get by id
router.post(
  '/v1/getEmployeementcompanyid',
  EmployeementController.getEmployeementcompanyid
); //get by company_id
router.post('/v1/updatebyid', EmployeementController.postUpdateEmployeement); //update Employeement
router.get(
  '/v1/getEmployeementBycompanyid/:id',
  EmployeementController.getEmployeementByCompanyId
); //update Employeement
router.post(
  '/v1/deletebyid',
  EmployeementController.postDeleteEmployeementById
); //Delete Employeement

module.exports = router;
