const express = require('express');
const router = express.Router();
const contractorcontroller = require('../controllers/contractor.controller');
const contractor = require('../models/contractor');
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', contractorcontroller.postadddata);

router.get('/v1/listdata', contractorcontroller.listdata);

router.put('/v1/editdata/:id', contractorcontroller.editdata);

router.delete('/v1/deletedata/:id', contractorcontroller.deletedata);

router.get('/v1/getdata/:id', contractorcontroller.getdata);

router.post('/v1/poststatuschange', contractorcontroller.poststatuschange);

router.post(
  '/v1/validateExcel',
  uploadfile,
  contractorcontroller.validateUploadExcel
);

router.post(
  '/v1/revalidateContractor',
  contractorcontroller.revalidateContractor
);

router.post(
  '/v1/addValidateContractor',
  contractorcontroller.addValidateContractor
);

router.post('/v1/generateDemoExcel', contractorcontroller.generateDemoExcel);
module.exports = router;
