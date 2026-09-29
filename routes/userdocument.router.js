const express = require('express');
const userDocumentController = require('../controllers/userdocument.controller');
const { uploaddocument } = require('../middleware/upload');
const router = express.Router();
const { uploaduserdocument } = require('../middleware/upload');

router.post(
  '/v1/add',
  uploaduserdocument,
  userDocumentController.postAddUserDocument
); // save data
router.post('/v1/getalldata', userDocumentController.getAllUserDocumentData); //get all user document data
router.get('/v1/getbyid/:id', userDocumentController.getUserDocumentById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  userDocumentController.getUserDocumentByUserMasterId
); //get by user id
router.post(
  '/v1/updatebyid',
  uploaduserdocument,
  userDocumentController.postUpdateUserDocument
); //update user document data
router.post(
  '/v1/deletebyid',
  userDocumentController.postDeleteUserDocumentById
); //delete by id
router.post('/v1/statuschanges', userDocumentController.poststatuschange); //status change
router.post('/v1/verifyreq', userDocumentController.postDocVerifyRequest); //status change

router.post(
  '/v1/UserExpiryDocument',
  userDocumentController.UserExpiryDocument
);

module.exports = router;
