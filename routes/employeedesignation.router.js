const express = require('express');
const employeeDesignationController = require('../controllers/employeedesignation.controller');
const router = express.Router();

router.post(
  '/v1/add',
  employeeDesignationController.postAddEmployeeDesignation
); // save data
router.post(
  '/v1/getalldata',
  employeeDesignationController.getAllEmployeeDesignationData
); //get all emplyee designation data
router.get(
  '/v1/getbyid/:id',
  employeeDesignationController.getEmployeeDesignationById
); //get by id
router.get(
  '/v1/getbyuserid/:id',
  employeeDesignationController.getEmployeeDesignationByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  employeeDesignationController.postUpdateEmployeeDesignation
); //update emplyee designation data
router.post(
  '/v1/deletebyid',
  employeeDesignationController.postDeleteEmployeeDesignationById
); //delete by id
router.post(
  '/v1/statuschanges',
  employeeDesignationController.poststatuschange
); //status change
router.get(
  '/v1/getbyuseridselecteds/:id',
  employeeDesignationController.getEmployeeDesignationSelectedByUserId
); //get by user id
// router.get('/v1/activate', employeeDesignationController.changeStatusByDate); //status change by date
router.post(
  '/v1/getEmployeeDesignation',
  employeeDesignationController.getEmployeeDesignation
); //status changeget
router.post(
  '/v1/addbulk',
  employeeDesignationController.postAddEmployeeDesignationBULK
); // save data

module.exports = router;
