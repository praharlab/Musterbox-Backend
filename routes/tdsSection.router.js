const express = require('express');
const router = express.Router();

const tdsSectionController = require('../controllers/tdsSection.controller');
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', tdsSectionController.addtdsSection);
router.put('/v1/:id', tdsSectionController.updateTdsSection);
router.put('/v1/updateStatus/:id', tdsSectionController.updateStatus);
router.get('/v1/getAllData', tdsSectionController.getAllData);
router.get('/v1/getById/:id', tdsSectionController.getById);
router.post(
  '/v1/uploadSection',
  uploadfile,
  tdsSectionController.uploadSection
);

module.exports = router;
