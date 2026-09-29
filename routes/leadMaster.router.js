const express = require('express');
const router = express.Router();
const leadMasterController = require('../controllers/leadMaster.controller');

router.post('/v1/addLeadMaster', leadMasterController.addLeadMaster); // add lead
router.get('/v1/getallLead', leadMasterController.getallLead); // Get lead

module.exports = router;
