const express = require('express');
const spController = require('../controllers/storedprocedure.controller');
const router = express.Router();

router.post('/v1/create', spController.createProcedures); // create Procedures
module.exports = router;
