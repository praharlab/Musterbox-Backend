const express = require('express');
const payheadController = require('../controllers/payhead.controller');
const router = express.Router();
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

router.use(bodyParser.json());

//file Upload setting
const PATH = './uploads';
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PATH);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

let upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 * 1024 },
});

router.post('/v1/add', payheadController.postAddPayhead); // save data
router.post('/v1/getalldata', payheadController.getAllPayhead); //get all state data
router.post(
  '/v1/addfile',
  upload.single('file'),
  payheadController.postImportData
); // save data
router.get('/v1/getbyid/:id', payheadController.getPayheadById); //get by id
router.post('/v1/updatebyid', payheadController.postUpdatePayhead); //update state data
router.post('/v1/deletebyid', payheadController.postDeletePayheadById); //delete by id
router.post('/v1/statuschanges', payheadController.poststatuschange); //status change
router.post('/v1/getActivePayhead', payheadController.getActivePayhead); //status change

module.exports = router;
