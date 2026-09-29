const express = require('express');
const hrToolKitController = require('../controllers/hrToolKit.controller');
const router = express.Router();
const { uploadhrtoolkit } = require('../middleware/upload');

router.post('/v1/add', uploadhrtoolkit, hrToolKitController.postAddDocument); // save data
router.post('/v1/getAll', hrToolKitController.getAllHRADocument); // save data
router.post('/v1/deletebyID', hrToolKitController.postDeleteHRToolKitById); // save data
router.post('/v1/statuschange', hrToolKitController.postCHANGESTATUSById); // save data

module.exports = router;
