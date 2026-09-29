const express = require('express');
const incomeTaxSlabsController = require('../controllers/incomeTaxSlabs.controller');
const router = express.Router();

router.post('/v1/add', incomeTaxSlabsController.addIncomeTaxSlab);
router.put('/v1/:id', incomeTaxSlabsController.updateIncomeTaxSlab);
router.put('/v1/updatestatus/:id', incomeTaxSlabsController.updateStatus);
router.get('/v1/getAllData', incomeTaxSlabsController.getAllData);
router.get('/v1/getById/:id', incomeTaxSlabsController.getById);

module.exports = router;
