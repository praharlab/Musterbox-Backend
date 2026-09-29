const express = require('express');
const workingAreaController = require('../controllers/workingArea.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.post('/v1/addData', workingAreaController.addData);
router.put('/v1/updateData/:id', workingAreaController.updateData);
router.get('/v1/listData', verifyChildParent, workingAreaController.listData);
router.delete('/v1/deleteData/:id', workingAreaController.deleteData);
router.get('/v1/getById/:id', workingAreaController.getById);
router.post('/v1/uploadExcel', uploadfile, workingAreaController.uploadExcel);
router.get('/v1/demoExcel', workingAreaController.demoExcel);
router.post('/v1/updateStatus', workingAreaController.updateStatus);
router.post('/v1/validateExcel', uploadfile, workingAreaController.validateUploadExcel);

router.post('/v1/reValidateWorkingArea', workingAreaController.reValidateWorkingArea);

router.post('/v1/addValidateWorkingArea', workingAreaController.addValidateWorkingArea)

module.exports = router;
