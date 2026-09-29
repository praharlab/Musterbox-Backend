const express = require('express');
const userFamilyController = require('../controllers/userfamily.controller');
const router = express.Router();

router.post('/v1/add', userFamilyController.postAdduserFamily); // save data

router.get('/v1/getbyid/:id', userFamilyController.getuserFamilyById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  userFamilyController.getuserFamilyByUserMasterId
); //get by user id
router.post('/v1/updatebyid', userFamilyController.postUpdateuserFamily); //update user education data
router.post('/v1/deletebyid', userFamilyController.postDeleteuserFamilyById); //delete by id
router.post('/v1/statuschanges', userFamilyController.poststatuschange); //status change
router.post('/v1/verifyreq', userFamilyController.postVerifyRequest);

module.exports = router;
