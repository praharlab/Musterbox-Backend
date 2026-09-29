const express = require('express');
const hrLeaveTypesController = require('../controllers/hrLeaveTypes.controller');
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
router.post('/v1/add', hrLeaveTypesController.postAddHrLeaveTypes); // save data
router.post('/v1/getalldata', hrLeaveTypesController.getAllHrLeaveTypes); //get all hr salary fields data
router.get('/v1/getbyid/:id', hrLeaveTypesController.getHrLeaveTypesById); //get by id
router.post('/v1/updatebyid', hrLeaveTypesController.postUpdateHrLeaveTypes); //update hr salary fields data
router.post('/v1/deletebyid', hrLeaveTypesController.postDeleteHrLeaveTypeById); //delete by id
router.post(
  '/v1/addfile',
  upload.single('file'),
  hrLeaveTypesController.postImportData
); // save data
router.post('/v1/statuschanges', hrLeaveTypesController.poststatuschange); //status change
router.post(
  '/v1/getdatabycompany',
  hrLeaveTypesController.getHrLeaveTypesByCompany
); //HRLeave By Company

router.post(
  '/v1/getdatabyusercompany',
  hrLeaveTypesController.getHrLeaveTypesByCompany1
); //HRLeave By user Company

router.get(
  '/v1/getDataWithoutOutDuty/:id',
  hrLeaveTypesController.listDataWithoutOutdoorDuty
);

// Add data of out door duty in all company

router.post(
  '/v1/addDataInAllCompany',
  hrLeaveTypesController.addDataInAllCompany
);

router.get(
  '/v1/listLeaveTypeForManageLeave/:id',
  hrLeaveTypesController.listLeaveTypeForManageLeave
);
module.exports = router;
