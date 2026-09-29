const express = require('express');
const SalaryIncrementController = require('../controllers/salaryIncrement.controller');
const router = express.Router();

router.post('/v1/add', SalaryIncrementController.postAddIncrement);
router.post('/v1/checkdata', SalaryIncrementController.checkdata);
router.post('/v1/getdata', SalaryIncrementController.getdata);
router.post(
  '/v1/calculateincrement',
  SalaryIncrementController.calculateincrement
);
router.post('/v1/changeincrement', SalaryIncrementController.changeincrement);

module.exports = router;
