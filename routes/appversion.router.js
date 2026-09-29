const express = require('express');
const appVersionController = require('../controllers/appversion.controller');
const router = express.Router();

router.get('/v1/getalldata', appVersionController.getAllAppVersionData); //get all appVersion data
router.get('/v1/getbyid/:id', appVersionController.getAppVersionById); //get by id
router.post('/v1/updatebyid', appVersionController.postUpdateAppVersion); //update appVersion data

module.exports = router;
