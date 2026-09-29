const express = require('express');
const tdsSubSectionController = require('../controllers/tdsSubSection.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', tdsSubSectionController.addtdsSubSection);
router.put('/v1/:id', tdsSubSectionController.updatetdsSubSection);
router.put('/v1/updatestatus/:id', tdsSubSectionController.updateStatus);
router.get('/v1/getAllData', tdsSubSectionController.getAllData);
router.get('/v1/getById/:id', tdsSubSectionController.getById);
router.post(
  '/v1/uploadSubSection',
  uploadfile,
  tdsSubSectionController.uploadSubSection
);

module.exports = router;
