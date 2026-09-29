const express = require('express');
const employeeJoiningController = require('../controllers/employeeJoiningDetails.controller');
const router = express.Router();
const { uploadfile, uploaduserdocument } = require('../middleware/upload');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const {
  configureMulterMultipleNames,
  handleMulterErrors,
} = require('../middleware/multer');

const path = require('path');

const multerMiddleware = configureMulterMultipleNames(
  path.join(__dirname, '../uploads/user-faces'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png']
);

router.post(
  '/v1/add',
  uploaduserdocument,
  employeeJoiningController.AddEmpJoiningnpmDetails
); // save data
router.post(
  '/v1/addpanphoto',
  uploaduserdocument,
  employeeJoiningController.addpanphoto
); // save data
router.get(
  '/v1/getbyid/:id',
  employeeJoiningController.getEmployeeJoiningDetBydetailId
); //get by id
router.get(
  '/v1/getbyuserid/:id',
  employeeJoiningController.getEmployeeJoiningDetByuserId
); //get by user id
router.post(
  '/v1/updatebyid',
  employeeJoiningController.postUpdateEmployeeJoiningDetail
); //update emplyee Joining Date data
router.post('/v1/statuschanges', employeeJoiningController.poststatuschange); //status change
router.post(
  '/v1/joiningExcel',
  uploadfile,
  employeeJoiningController.joiningExcel
); //status change
router.post('/v1/getEMPList', employeeJoiningController.getAllEMPList); //status change

router.post('/v1/employeeIdCard', employeeJoiningController.employeeIdCard);

router.get(
  '/v1/profileStatus',
  verifyChildParent,
  employeeJoiningController.profileStatus
);

router.post(
  '/v1/updateUserFaces',
  multerMiddleware.array('userFaces', 5),
  employeeJoiningController.updateUserFaces
);

router.post('/v1/removeUserFaces', employeeJoiningController.removeUserFaces);
router.post('/v1/checkUserFaces', employeeJoiningController.checkUserFaces);

router.post(
  '/v1/getAssignedBiometricUserList',
  employeeJoiningController.getAssignedBiometricUserList
);

module.exports = router;
