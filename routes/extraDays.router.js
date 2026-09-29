const express = require('express');
const extraDaysController = require('../controllers/extraDays.controller');
const router = express.Router();

router.post('/v1/addExtraDays', extraDaysController.addExtraDays);
router.post('/v1/getAllExtraDays', extraDaysController.getAllExtraDays);

module.exports = router;