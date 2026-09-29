const express = require('express');
const stateMasterController = require('../controllers/statemaster.controller');
const router = express.Router();
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const { verifyToken } = require('../middleware/tokenverify');

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

router.post('/v1/add', verifyToken, stateMasterController.postAddState); // save data
router.post('/v1/getalldata', stateMasterController.getAllStateData); //get all state data
router.post(
  '/v1/addfile',
  verifyToken,
  upload.single('file'),
  stateMasterController.postImportData
); // save data
router.get('/v1/getbyid/:id', stateMasterController.getStateById); //get by id
router.post(
  '/v1/updatebyid',
  verifyToken,
  stateMasterController.postUpdateState
); //update state data
router.post(
  '/v1/deletebyid',
  verifyToken,
  stateMasterController.postDeleteStateById
); //delete by id
router.get('/v1/getbycountryid/:id', stateMasterController.getStateBycountryid); //get by countryid
router.post(
  '/v1/statuschanges',
  verifyToken,
  stateMasterController.poststatuschange
); //status change
module.exports = router;
