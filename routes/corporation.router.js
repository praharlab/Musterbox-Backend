const express = require('express');
const router = express.Router();
const corporationController = require('../controllers/corporation.controller');

router.get('/v1/getByStateId/:id',corporationController.getByStateId);

module.exports = router;
