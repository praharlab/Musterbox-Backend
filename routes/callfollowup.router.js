const express = require('express');
const callfollowupContoller = require('../controllers/callfollowup.controller');
const router = express.Router();

router.post('/v1/add', callfollowupContoller.postAddCallFollowup); // save data
router.get('/v1/getbyid/:id', callfollowupContoller.getCallFollowupId); //get by id
router.post('/v1/updatebyid', callfollowupContoller.postUpdateCallFollowup); //update data
router.post('/v1/deletebyid', callfollowupContoller.postDeleteCallFollowupById); //delete by id
router.post('/v1/statuschange', callfollowupContoller.poststatuschange); //status by id
router.post(
  '/v1/getCallFollowupuserid',
  callfollowupContoller.getCallFollowupuserid
); //get by id
router.post(
  '/v1/getCallFollowupvisitid',
  callfollowupContoller.getCallFollowupvisitid
); //get by id

module.exports = router;
