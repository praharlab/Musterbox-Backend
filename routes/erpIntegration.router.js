const express = require('express');
const erpIngegrationController = require('../controllers/erpIntegration.controller');
const router = express.Router();

router.post('/v1/add', erpIngegrationController.postadd);

router.post('/v1/listdata', erpIngegrationController.listdata);

router.put('/v1/editdata/:id', erpIngegrationController.editdata);

router.delete('/v1/deletedata/:id', erpIngegrationController.deletebyid);

router.get('/v1/getdata/:id', erpIngegrationController.getById);

router.post('/v1/erpHeadName', erpIngegrationController.erpHeadName);

module.exports = router;
