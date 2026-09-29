const express = require('express');
const countryMasterController = require('../controllers/countrymaster.controller');
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

router.post('/v1/add', verifyToken, countryMasterController.postAddCountry); // save data
router.post(
  '/v1/addfile',
  verifyToken,
  upload.single('file'),
  countryMasterController.postImportData
); // save data
router.post('/v1/getalldata', countryMasterController.getAllCountryData); //get all country data
router.get('/v1/getbyid/:id', countryMasterController.getCountryById); //get by id
router.post(
  '/v1/updatebyid',
  verifyToken,
  countryMasterController.postUpdateCountry
); //update country data
router.post(
  '/v1/deletebyid',
  verifyToken,
  countryMasterController.postDeleteCountryById
); //delete by id
router.post(
  '/v1/statuschanges',
  verifyToken,
  countryMasterController.poststatuschange
); //status change
module.exports = router;
