const express = require('express');
const employeeDivisionController = require('../controllers/employeeDivision.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.post('/v1/addData', employeeDivisionController.addData); // save data
router.get('/v1/getByUserId/:id', employeeDivisionController.getByUserId); // get data

router.post('/v1/addbulk', employeeDivisionController.addBulk); // add bulk data

router.get(
  '/v1/getDataBycompanyId/:id',
  employeeDivisionController.getDataBycompanyId
); // get data

router.get(
  '/v1/getEmployeeDivisionByCompany',
  verifyChildParent,
  employeeDivisionController.getEmployeeDivisionByCompany
);

router.get(
  '/v1/downloadDemoExcel',
  employeeDivisionController.downloadDemoExcel
);
router.post(
  '/v1/uploadDivision',
  uploadfile,
  employeeDivisionController.uploadDivision
);
router.post(
  '/v1/deletebyid',
  employeeDivisionController.postDeleteEmployeeDivision
); //delete by id
module.exports = router;
