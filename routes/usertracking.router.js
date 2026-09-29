const express = require('express');
const userTrackingController = require('../controllers/usertracking.controller');
const router = express.Router();

router.post('/v1/add', userTrackingController.postAddUserTracking); // save data
router.post('/v1/check', userTrackingController.postCheckTracking); // check user tracking
router.get('/v1/getbyid/:id', userTrackingController.getUserTrackingById); //get by id
router.post(
  '/v1/getbycompanyid',
  userTrackingController.getUserTrackingByCompanyId
); //get by company id
router.post('/v1/updatebyid', userTrackingController.postUpdateUserTracking); //update user tracking data
router.post('/v1/disable', userTrackingController.postDisableUserTracking); //disable user tracking data
module.exports = router;
