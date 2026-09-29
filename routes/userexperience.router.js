const express = require('express');
const userExperienceController = require('../controllers/userexperience.controller');
const router = express.Router();

router.post('/v1/add', userExperienceController.postAddUserExperience); // save data
router.post(
  '/v1/getalldata',
  userExperienceController.getAllUserExperienceData
); //get all user experience data
router.get('/v1/getbyid/:id', userExperienceController.getUserExperienceById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  userExperienceController.getUserExperienceByUserMasterId
); //get by user id
router.post(
  '/v1/updatebyid',
  userExperienceController.postUpdateUserExperience
); //update user experience data
router.post(
  '/v1/deletebyid',
  userExperienceController.postDeleteUserExperienceById
); //delete by id
router.post('/v1/statuschanges', userExperienceController.poststatuschange); //status change
router.post('/v1/verifyreq', userExperienceController.postexpVerifyRequest);

module.exports = router;
