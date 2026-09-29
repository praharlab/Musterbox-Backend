const express = require('express');
const userEducationController = require('../controllers/usereducation.controller');
const router = express.Router();
const { uploaduserdegree } = require('../middleware/upload');

router.post(
  '/v1/updatebyid',
  uploaduserdegree,
  userEducationController.postUpdateUserEducation
); //update user education data
router.post(
  '/v1/add',
  uploaduserdegree,
  userEducationController.postAddUserEducation
); // save data

router.post('/v1/getalldata', userEducationController.getAllUserEducationData); //get all user education data
router.get('/v1/getbyid/:id', userEducationController.getUserEducationById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  userEducationController.getUserEducationByUserMasterId
); //get by user id
router.post(
  '/v1/deletebyid',
  userEducationController.postDeleteUserEducationById
); //delete by id
router.post('/v1/statuschanges', userEducationController.poststatuschange); //status change
router.post('/v1/verifyreq', userEducationController.postEduVerifyRequest);

module.exports = router;
