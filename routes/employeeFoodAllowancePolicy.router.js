const express = require('express');
const employeeFoodAllowancePolicyController = require('../controllers/employeeFoodAllowancePolicy.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.get(
  '/v1/getEmployeeFoodAllowancePolicyByCompany',
  verifyChildParent,
  employeeFoodAllowancePolicyController.getEmployeeFoodAllowancePolicyByCompany
);

router.get(
  '/v1/getByUserId/:id',
  employeeFoodAllowancePolicyController.getByUserId
); // get data

router.post('/v1/addbulk', employeeFoodAllowancePolicyController.addBulk); // add bulk data

router.get(
  '/v1/getDataBycompanyId/:id',
  employeeFoodAllowancePolicyController.getDataBycompanyId
); // get data

module.exports = router;
