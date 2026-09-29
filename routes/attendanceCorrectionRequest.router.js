const express = require('express');
const attendanceCorrectionRequestController = require('../controllers/attendanceCorrectionRequest.controller');
const router = express.Router();

router.post('/v1/add', attendanceCorrectionRequestController.addData);
router.put('/v1/update/:id', attendanceCorrectionRequestController.updateData);
router.delete(
  '/v1/delete/:id',
  attendanceCorrectionRequestController.deleteData
);
router.get('/v1/getById/:id', attendanceCorrectionRequestController.getById);
router.post(
  '/v1/getByUserId',
  attendanceCorrectionRequestController.getByUserId
);

module.exports = router;
