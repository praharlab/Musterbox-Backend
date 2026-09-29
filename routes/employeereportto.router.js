const express = require('express');
const employeeReportToController = require('../controllers/employeereportto.controller');
const { permissionAccess } = require('../middleware/permissionAccess');
const router = express.Router();

router.post(
  '/v1/add',
  permissionAccess,
  employeeReportToController.postAddEmployeeReportTo
); // save data
router.post(
  '/v1/getalldata',
  permissionAccess,
  employeeReportToController.getAllEmployeeReportToData
); //get all employee report to data
router.get(
  '/v1/getbyid/:id',
  permissionAccess,
  employeeReportToController.getEmployeeReportToById
); //get by id
router.get(
  '/v1/getbyuserid/:id',
  permissionAccess,
  employeeReportToController.getEmployeeReportToByUserMasterId
); //get by user id
router.post(
  '/v1/updatebyid',
  permissionAccess,
  employeeReportToController.postUpdateEmployeeReportTo
); //update employee report to data
router.post(
  '/v1/deletebyid',
  permissionAccess,
  employeeReportToController.postDeleteEmployeeReportToById
); //delete by id
router.post(
  '/v1/statuschanges',
  permissionAccess,
  employeeReportToController.poststatuschange
); //status change
router.post(
  '/v1/getstructure',
  permissionAccess,
  employeeReportToController.postEmployeeReportToStructure
); //report structure
router.get(
  '/v1/getreportingemployees/:id',
  permissionAccess,
  employeeReportToController.getReportingEmployees
); //report structure

router.post(
  '/v1/updateallreportid',
  permissionAccess,
  employeeReportToController.updateAllReportToID
);
module.exports = router;
