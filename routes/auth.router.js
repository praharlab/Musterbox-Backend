const express = require('express');
const authcontroller = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/tokenverify');
const router = express.Router();
const { uploaduserphoto } = require('../middleware/upload');

router.post('/v1/login', authcontroller.login); //  Login
router.post('/v1/mobilelogin', authcontroller.mobilelogin); //  Mobile Login
router.post('/v1/changepassword', verifyToken, authcontroller.changepassword); //  Change Password
router.get('/v1/profile/:id', verifyToken, authcontroller.getprofile); //  Profile
router.get(
  '/v1/getprofileWithCutomizeFields/:id',
  verifyToken,
  authcontroller.getprofileWithCutomizeFields
); //  Profile
router.post('/v1/editprofile', uploaduserphoto, authcontroller.editprofile); //update by id
router.post('/v1/forgot', authcontroller.forgot); //  Forgot Password
router.post('/v1/reset', authcontroller.otpverifyandchangepassword); //  Reset Password

router.post('/v1/dashboardcheck', verifyToken, authcontroller.dashboardcheck); //  Dashboard

router.post('/v1/dashboard1', verifyToken, authcontroller.dashborad1); //  childmenupermission
router.get('/v1/checkfcm', verifyToken, authcontroller.checkfcm); //  childmenupermission
router.get('/v1/birthday/:id', verifyToken, authcontroller.birthday1); //  birthday date
router.post('/v1/Facelogin', authcontroller.Facelogin); // Face Login

router.post(
  '/v1/finalcheckpermission',
  verifyToken,
  authcontroller.finalcheckpermission
);

router.post('/v1/resetpassword', authcontroller.resetpassword);
router.get('/v1/birthday', verifyToken, authcontroller.birthday);
router.get('/v1/anniversary', verifyToken, authcontroller.anniversary);
router.get('/v1/user-pages', verifyToken, authcontroller.pageSearch);
router.post('/v1/userLogout', verifyToken, authcontroller.userLogout);

router.post(
  '/v1/changepasswordMultipleEmp',
  authcontroller.changepasswordMultipleEmp
);

router.post('/v1/forgotpasswordOtpMARS', authcontroller.forgotpasswordOtpMARS); //  Forgot Password
router.post('/v1/checkPasswordTokenMARS', authcontroller.checkPasswordTokenMARS); //  Forgot Password

module.exports = router;
