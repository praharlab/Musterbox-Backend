const express = require('express');
const companyContactController = require('../controllers/companyContact.controller');
const router = express.Router();
const {
  uploadfile,
  uploaduserphoto,
  faceUpload,
  uploadUserDocument,
} = require('../middleware/upload');
const { permissionAccess } = require('../middleware/permissionAccess');

router.post(
  '/v1/add',
  permissionAccess,
  uploadUserDocument,
  companyContactController.postAddCompanyContact
); // save data
router.post(
  '/v1/getalldata',
  permissionAccess,
  companyContactController.getAllcompanycontact
); // get all data
router.get(
  '/v1/getbyid/:id',
  permissionAccess,
  companyContactController.getCompanyContactId
); //get by id
router.post(
  '/v1/updatebyid',
  permissionAccess,
  uploaduserphoto,
  companyContactController.postUpdateCompanyContact
); //update by id
router.post(
  '/v1/deletebyid',
  permissionAccess,
  companyContactController.postDeleteCompanyContactById
); //update by id
router.post(
  '/v1/statuschanges',
  permissionAccess,
  companyContactController.poststatuschange
); //status by id
router.post(
  '/v1/getlist',
  permissionAccess,
  companyContactController.postGetUserList
); //get all users
router.post(
  '/v1/getbycompanyid',
  permissionAccess,
  companyContactController.getCompanyContactByCompanyId
); //get all users
router.post(
  '/v1/filteruser',
  permissionAccess,
  companyContactController.filteruser
); //get all users
router.post(
  '/v1/getallsuperadmin',
  permissionAccess,
  companyContactController.getAllSUPERADMIN
); //get all rights
router.post(
  '/v1/checkuser',
  permissionAccess,
  companyContactController.postCheckUser
); //get all rights
router.post(
  '/v1/removeuniqueid',
  permissionAccess,
  companyContactController.removeuniqueid
);
router.post(
  '/v1/changeallpassword',
  permissionAccess,
  companyContactController.changeallpassword
);
router.post(
  '/v1/getAllBranchcontact',
  permissionAccess,
  companyContactController.getAllBranchcontact
);
router.post(
  '/v1/getAllUser',
  permissionAccess,
  companyContactController.getAllcontact
); // get all employee by branch id
router.post('/v1/getAllCC', companyContactController.getAllBranchcontact); // get all employee by branch id
router.post(
  '/v1/getbranchcontactBydate',
  permissionAccess,
  companyContactController.getbranchcontactBydate
);

router.post(
  '/v1/employeepolicy',
  permissionAccess,
  companyContactController.employeepolicy
);
router.get(
  '/v1/dashboardempstatus/:id',
  permissionAccess,
  companyContactController.dashboardeEmpstatus
);

router.post(
  '/v1/userFaceData',
  permissionAccess,
  faceUpload,
  companyContactController.postAddUserFaceData
);

router.post(
  '/v1/getallsubadmin',
  permissionAccess,
  companyContactController.getAllSUBADMIN
);

router.post(
  '/v1/uploaduserExcel',
  permissionAccess,
  uploadfile,
  companyContactController.uploaduserExcel
); // upload all employeedata with salary
router.post(
  '/v1/exportuserExcel',
  permissionAccess,
  uploadfile,
  companyContactController.exportuserExcel
);

router.post(
  '/v1/exportUsersAllData',
  permissionAccess,
  companyContactController.exportUsersAllData
);

router.post(
  '/v1/getUserbyBranchDepartmentDesgination',
  permissionAccess,
  companyContactController.getUserbyBranchDepartmentDesgination
);

router.get(
  '/v1/getUserbyCompanyandDateRange',
  permissionAccess,
  companyContactController.getUserDatabyCompanyandDateRange
);

router.get(
  '/v1/getUserByBranchandDateRange',
  permissionAccess,
  companyContactController.getUserDatabyBranchandDateRange
);

router.get(
  '/v1/getbyname',
  permissionAccess,
  companyContactController.getCompanyContactName
);

router.get(
  '/v1/ExportAuthorizationDetails',
  permissionAccess,
  companyContactController.ExportAuthorizationDetails
);
router.post(
  '/v1/getAllUsers',
  permissionAccess,
  companyContactController.getAllUsers
);

router.post(
  '/v1/lockstatus',
  permissionAccess,
  companyContactController.postUpdatePhotoLockStatus
);

router.post(
  '/v1/getalldiler',
  permissionAccess,
  companyContactController.getalldiler
);
router.post(
  '/v1/getProfilePercentage',
  permissionAccess,
  companyContactController.getProfilePercentage
);

router.post(
  '/v1/removeProfilePhoto',
  permissionAccess,
  companyContactController.removeProfilePhoto
);

router.post(
  '/v1/getEmployeeSatus',
  permissionAccess,
  companyContactController.getEmployeeSatus
);

router.get(
  '/v1/ExportAuthorizationDetailsNEW',
  permissionAccess,
  companyContactController.ExportAuthorizationDetailsNEW
);

router.post(
  '/v1/validatUploadAuthorizationDetails',
  permissionAccess,
  uploadfile,
  companyContactController.validatUploadAuthorizationDetails
); // Validate Employee Authorization

router.post(
  '/v1/addUpdateAuthorization',
  permissionAccess,
  companyContactController.addUpdateAuthorization
);

router.post(
  '/v1/bulkDownloadProfilePics',
  permissionAccess,
  companyContactController.bulkDownloadProfilePics
);

router.get('/v1/getUserById/:id', companyContactController.getUserById);

module.exports = router;
