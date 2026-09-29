const express = require('express');
const employeeJoiningRequestcontroller = require('../controllers/employeeJoiningRequest.controller');
const router = express.Router();
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const { uploadEmployeeJoiningRequestPhoto } = require('../middleware/upload');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/employeeJoiningRequest'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png', 'image/jpg']
);

router.post(
  '/v1/addemployeeJoiningRequest',
  uploadEmployeeJoiningRequestPhoto,
  employeeJoiningRequestcontroller.addemployeeJoiningRequest
);

router.get(
  '/v1/getallemployeeJoiningRequest',
  employeeJoiningRequestcontroller.getallEmployeeJoiningRequest
);

router.get(
  '/v1/getEmployeeJoiningRequestById/:id',
  employeeJoiningRequestcontroller.getEmployeeJoiningRequestById
);

router.post(
  '/v1/editAllEmployeeJoiningRequest',
  uploadEmployeeJoiningRequestPhoto,
  employeeJoiningRequestcontroller.editAllEmployeeJoiningRequest
);

router.post(
  '/v1/editStatusEmployeeJoiningRequest',
  employeeJoiningRequestcontroller.editStatusEmployeeJoiningRequest
);
router.post('/v1/removeImages', employeeJoiningRequestcontroller.removeImages);

router.get(
  '/v1/employeejoiningRequestFormDownload',
  employeeJoiningRequestcontroller.employeejoiningRequestFormDownload
); //downlaod the form
module.exports = router;
