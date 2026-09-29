const express = require('express');
const employeeNdacontroller = require('../controllers/employeeNda.controller');
const router = express.Router();
const { uploadcompanyNda } = require('../middleware/upload');

router.post('/v1/add', uploadcompanyNda, employeeNdacontroller.postAddemployee); //save the data
router.post('/v1/getalldata', employeeNdacontroller.getAllemployeeData); //get the data
router.get('/v1/getbyid/:id', employeeNdacontroller.getemployeeById); //get data by id
router.post(
  '/v1/update',
  uploadcompanyNda,
  employeeNdacontroller.updateemployeeData
); //update the data by id
router.get('/v1/delete/:id', employeeNdacontroller.deleteemployee); //delete data
router.post('/v1/bycompanyid', employeeNdacontroller.getbyCompanyId); //get by company id

module.exports = router;
