const express = require('express');
const pfStatusController = require('../controllers/pfsetup.controller');
const router = express.Router();

router.post('/v1/add', pfStatusController.postAddPFSetup); // save data
router.get('/v1/getbyid/:id', pfStatusController.getPFetupById); //get by id
router.post('/v1/getalldatapt', pfStatusController.getalldatapt); //status change
module.exports = router;
