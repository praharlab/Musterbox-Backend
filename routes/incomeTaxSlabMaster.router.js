const express = require('express');
const incomeTaxSlabMasterController = require('../controllers/incomeTaxSlabMatser.controller');
const router = express.Router();

router.post('/v1/add', incomeTaxSlabMasterController.addIncomeTaxSlabMaster);
router.put('/v1/:id', incomeTaxSlabMasterController.updateIncomeTaxSlabMaster);
router.put('/v1/updatestatus/:id', incomeTaxSlabMasterController.updateStatus);
router.get('/v1/getAllData', incomeTaxSlabMasterController.getAllData);
router.get('/v1/getById/:id', incomeTaxSlabMasterController.getById);

module.exports = router;
