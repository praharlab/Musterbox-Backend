const express = require('express');
const officeExpenseAuthRequestController = require('../controllers/officeExpenseAuthRequest.controller');
const router = express.Router();

router.post('/v1/getAllOfficeExpenseRequest', officeExpenseAuthRequestController.getAllOfficeExpenseRequest);
router.post('/v1/acceptRejectOfficeExpenses', officeExpenseAuthRequestController.acceptRejectOfficeExpenses);


module.exports = router;