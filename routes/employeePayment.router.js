const express = require('express');
const EmployeePaymentcontroller = require('../controllers/employeePayment.controller');
const router = express.Router();


router.post('/v1/listEmployeeBonusPayment', EmployeePaymentcontroller.listEmployeeBonusPayment);

router.post('/v1/getEmployeeBonusByUserId', EmployeePaymentcontroller.getEmployeeBonusByUserId);

router.post('/v1/payEmployeeBonus', EmployeePaymentcontroller.payEmployeeBonus); 



module.exports = router;