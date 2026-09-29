const express = require('express');
const router = express.Router();
const companyNotificationSetupController = require('../controllers/companyNotificationSetup.controller');

router.post('/v1/addData', companyNotificationSetupController.addData);
router.put('/v1/updateData/:id', companyNotificationSetupController.updateData);
router.get('/v1/getById/:id', companyNotificationSetupController.getById);
router.get('/v1/getlist', companyNotificationSetupController.getlist);
router.delete(
  '/v1/deleteById/:id',
  companyNotificationSetupController.deleteById
);

module.exports = router;
