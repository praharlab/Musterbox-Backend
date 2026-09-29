const express = require('express');
const masterAdincontroller = require('../controllers/masteradmin.controller');
const router = express.Router();

router.post('/v1/add', masterAdincontroller.postAddmasterAdmin); // Save data
router.post('/v1/login', masterAdincontroller.login); //  Login
router.post('/v1/changepassword', masterAdincontroller.changepassword); //Change password
router.post('/v1/forgot', masterAdincontroller.forgot); //  Forgot Password
router.post('/v1/reset', masterAdincontroller.otpverifyandchangepassword); //  Reset Password

module.exports = router;
