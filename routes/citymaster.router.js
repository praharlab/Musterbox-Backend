const express = require('express');
const cityMasterController = require('../controllers/citymaster.controller');
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

router.post('/v1/add', verifyToken, cityMasterController.postAddCity); // save data
router.post(
  '/v1/addfile',
  verifyToken,
  upload.single('file'),
  cityMasterController.postImportData
); // save data
router.post('/v1/getalldata', cityMasterController.getAllCityData); //get all city data
router.get('/v1/getbyid/:id', cityMasterController.getCityById); //get by id
router.post('/v1/updatebyid', verifyToken, cityMasterController.postUpdateCity); //update city data
router.post(
  '/v1/deletebyid',
  verifyToken,
  cityMasterController.postDeleteCityById
); //delete by id
router.post(
  '/v1/statuschanges',
  verifyToken,
  cityMasterController.poststatuschange
); //status change
router.get(
  '/v1/getbgetCityBystateIdyid/:id',
  cityMasterController.getCityBystateId
); //get by id

router.post(
  '/v1/uploadExcel',
  upload.single('file'),
  cityMasterController.uploadExcel
);
module.exports = router;
