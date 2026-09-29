const express = require('express');
const bankStatementFormatController = require('../controllers/bankStatementFormat.controller');
const router = express.Router();

router.post('/v1/add', bankStatementFormatController.addBankStatementFormat); // save data
router.post('/v1/getBankStatementFormat', bankStatementFormatController.getBankStatementFormat); // save data
router.put('/v1/updateBankStatementFormat', bankStatementFormatController.updateBankStatementFormat); // save data
router.delete('/v1/deleteBankStatementFormat', bankStatementFormatController.deleteBankStatementFormat); // save data


module.exports = router;