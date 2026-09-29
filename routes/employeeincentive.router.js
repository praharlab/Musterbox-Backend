const express = require('express');
const employeeincentivecontroller = require('../controllers/employeeincentive.controller');
const router = express.Router();

router.post(
  '/v1/add',
  employeeincentivecontroller.postAddemployeeincentivetype
); // save data
router.post(
  '/v1/updatebyid',
  employeeincentivecontroller.postUpdateemployeeincentive
); //update data
router.get(
  '/v1/getbyid/:id',
  employeeincentivecontroller.getbyemployeeincentiveID
); //delete by id
router.post('/v1/getbyname', employeeincentivecontroller.getbyname); //delete by id
router.post(
  '/v1/getIncentiveTypeWithOutAttnBonus',
  employeeincentivecontroller.getIncentiveTypeWithOutAttnBonus
);
router.post(
  '/v1/statuschanges',
  employeeincentivecontroller.deleteemployeeincentiveData
); //soft delete
router.post(
  '/v1/getbycompanyid',
  employeeincentivecontroller.getemployeecompanyid
); //filter data
router.post(
  '/v1/searchquery',
  employeeincentivecontroller.getAllincentivedatabycompanyid
); // data
router.post('/v1/getalldata', employeeincentivecontroller.getAllincentiveData); //get all data

router.get('/v1/getMyIncentive', employeeincentivecontroller.getMyIncentive);

router.post(
  '/v1/addDataofASOPalave',
  employeeincentivecontroller.addDataofASOPalave
);

module.exports = router;
