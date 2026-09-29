const express = require('express');
const divisionController = require('../controllers/division.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.post('/v1/addData', divisionController.addData);
router.put('/v1/updateData/:id', divisionController.updateData);
router.get('/v1/listData', verifyChildParent, divisionController.listData);
router.delete('/v1/deleteData/:id', divisionController.deleteData);
router.get('/v1/getById/:id', divisionController.getById);
router.post('/v1/uploadExcel', uploadfile, divisionController.uploadExcel);
router.get('/v1/demoExcel', divisionController.demoExcel);
router.post('/v1/updateStatus', divisionController.updateStatus);
router.post('/v1/validateExcel', uploadfile, divisionController.validateUploadExcel);

router.post('/v1/reValidateDivision', divisionController.reValidateDivision);

router.post('/v1/addValidateDivision', divisionController.addValidateDivision)
module.exports = router;
