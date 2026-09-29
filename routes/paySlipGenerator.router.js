const express = require('express');
const PaySlipGeneratorController = require('../controllers/paySlipGenerator.controller');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();


router.post('/v1/getDateRanges', PaySlipGeneratorController.getDateRanges);
router.post('/v1/downloadDemoExcel', PaySlipGeneratorController.downloadDemoExcel);
router.post('/v1/validateUploadExcel',uploadfile, PaySlipGeneratorController.validateUploadExcel);
router.post('/v1/revalidateExcel', PaySlipGeneratorController.revalidateExcel);
router.post('/v1/saveData', PaySlipGeneratorController.saveData);
router.post('/v1/getPaySlipGeneratorData', PaySlipGeneratorController.getPaySlipGeneratorData);
router.post('/v1/generateSalarySlip', PaySlipGeneratorController.generateSalarySlip);
router.get('/v1/getMyPaySlipData', PaySlipGeneratorController.getMyPaySlipData);









module.exports = router;