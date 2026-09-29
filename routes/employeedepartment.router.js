const express = require('express');
const employeeDepartmentController = require('../controllers/employeedepartment.controller');
const router = express.Router();

router.post('/v1/add', employeeDepartmentController.postAddEmployeeDepartment); // save data
router.post(
  '/v1/getalldata',
  employeeDepartmentController.getAllEmployeeDepartmentData
); //get all emplyee designation data
router.get(
  '/v1/getbyid/:id',
  employeeDepartmentController.getEmployeeDepartmentById
); //get by id
router.get(
  '/v1/getbyuserid/:id',
  employeeDepartmentController.getEmployeeDepartmentByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  employeeDepartmentController.postUpdateEmployeeDepartment
); //update emplyee designation data
router.post(
  '/v1/deletebyid',
  employeeDepartmentController.postDeleteEmployeeDepartmentById
); //delete by id
router.post('/v1/statuschanges', employeeDepartmentController.poststatuschange); //status change
router.post(
  '/v1/getEmployeeDepartment',
  employeeDepartmentController.getEmployeeDepartment
); //status changeget
router.post(
  '/v1/addbulk',
  employeeDepartmentController.postAddEmployeeDepartmentBULK
); // save data
router.post(
  '/v1/getcurrentdepartment',
  employeeDepartmentController.empcurrentdepartment
);

module.exports = router;
