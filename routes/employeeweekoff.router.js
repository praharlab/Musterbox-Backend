const express = require('express');
const employeeWeekOffController = require('../controllers/employeeweekoff.controller');
const router = express.Router();

router.post('/v1/add', employeeWeekOffController.postAddEmployeeWeekOff); // save data
router.post(
  '/v1/getalldata',
  employeeWeekOffController.getAllEmployeeWeekOffData
); //get all emplyee week off data
router.get('/v1/getbyid/:id', employeeWeekOffController.getEmployeeWeekOffById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  employeeWeekOffController.getEmployeeWeekOffByUserId
); //get by user id
router.post(
  '/v1/updatebyid',
  employeeWeekOffController.postUpdateEmployeeWeekOff
); //update emplyee week off data
router.post(
  '/v1/deletebyid',
  employeeWeekOffController.postDeleteEmployeeWeekOffById
); //delete by id
router.post('/v1/statuschanges', employeeWeekOffController.poststatuschange); //status change
router.post(
  '/v1/getEmployeeWeekoff',
  employeeWeekOffController.getEmployeeWeekoff
); //status changeget
router.post(
  '/v1/addbulk',
  employeeWeekOffController.postAddEmployeeWeekoffBULK
); // save data

module.exports = router;
