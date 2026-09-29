const express = require('express');
const AutoMailSetupController = require('../controllers/autoMailSetup.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { uploadfile } = require('../middleware/upload');
const router = express.Router();

router.post('/v1/addData', AutoMailSetupController.addData);
router.put('/v1/updateData', AutoMailSetupController.updateData);
router.post(
  '/v1/listData',
  verifyChildParent,
  AutoMailSetupController.listData
);
router.delete('/v1/deleteData/:id', AutoMailSetupController.deleteData);
router.get('/v1/getById/:id', AutoMailSetupController.getById);

module.exports = router;
