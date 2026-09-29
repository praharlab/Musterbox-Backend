const express = require('express');
const previousSalaryController = require('../controllers/previousSalary.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.get('/v1/getDemoExcel', previousSalaryController.getDemoExcel); // save data

router.post(
  '/v1/uploadExcel',
  uploadfile,
  previousSalaryController.uploadExcel
);

router.post(
  '/v1/getPreviousSalaryData',
  previousSalaryController.getPreviousSalaryData
);

router.post('/v1/delete', previousSalaryController.delete);

module.exports = router;
