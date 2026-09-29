const express = require('express');
const employeeBranchController = require('../controllers/employeeBranch.controller');
const router = express.Router();

router.post('/v1/add', employeeBranchController.postAddEmployeeBranch); // save data
router.post(
  '/v1/getalldata',
  employeeBranchController.getAllEmployeeBranchData
); //get all emplyee designation data
router.get('/v1/getbyid/:id', employeeBranchController.getEmployeeBranchById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  employeeBranchController.getEmployeeBranchByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  employeeBranchController.postUpdateEmployeeBranch
); //update emplyee designation data
router.post(
  '/v1/deletebyid',
  employeeBranchController.postDeleteEmployeeBranchById
); //delete by id
router.post('/v1/statuschanges', employeeBranchController.poststatuschange); //status change
router.post(
  '/v1/getEmployeeBranch',
  employeeBranchController.getEmployeeBranch
); //status changeget
router.post('/v1/addbulk', employeeBranchController.postAddEmployeeBranchBULK); // save data
router.post('/v1/getcurrentbranch', employeeBranchController.empcurrentbranch);

router.get(
  '/v1/getEmployeeBranchByAttendacePolicy/:id',
  employeeBranchController.getEmployeeBranchByAttendacePolicy
); //get by user id

module.exports = router;
