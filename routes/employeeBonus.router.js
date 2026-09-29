const express = require('express');
const employeeBonusController = require('../controllers/employeeBonus.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', employeeBonusController.addData); // save data
router.post('/v1/listEmployeeBonus', employeeBonusController.listEmployeeBonus);
router.get(
  '/v1/cancelEmployeeBonus/:id',
  employeeBonusController.cancelEmployeeBonus
);

router.post('/v1/generateDemoExcel', employeeBonusController.generateDemoExcel);

router.post(
  '/v1/validateExcel',
  uploadfile,
  employeeBonusController.validateUploadExcel
);

router.post(
  '/v1/revalidateEmployeeBonus',
  employeeBonusController.revalidateEmployeeBonus
);

router.post(
  '/v1/addValidateEmployeeBonus',
  employeeBonusController.addValidateEmployeeBonus
);

router.post(
  '/v1/getEmployeeBonusByUserId',
  employeeBonusController.getEmployeeBonusByUserId
);
module.exports = router;
