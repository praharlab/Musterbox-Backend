const express = require('express');
const userLogsController = require('../controllers/userLogs.controller');
const router = express.Router();

router.post('/v1/add', userLogsController.postAddUserLogs); //save the data

module.exports = router;
