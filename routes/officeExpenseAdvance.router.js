const express = require('express');
const officeExpenseAdvanceController = require('../controllers/officeExpenseAdvance.controller');
const router = express.Router();

router.post('/v1/creditDebitAdvance', officeExpenseAdvanceController.creditDebitAdvance);
router.post('/v1/getAllOfficeExpenseAdvance', officeExpenseAdvanceController.getAllOfficeExpenseAdvance);

module.exports = router;