const express = require('express');
const SN_Code = require('../controllers/sn_code.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', SN_Code.addsn_code);
router.post('/v1/update', SN_Code.updatesn_code);
router.post('/v1/statuschange', SN_Code.updateStatus);
router.post('/v1/getAll', SN_Code.getAllData);
router.get('/v1/getById/:id', SN_Code.getById);
router.post('/v1/uploadSNCodes', uploadfile, SN_Code.uploadSNCodes);

module.exports = router;
