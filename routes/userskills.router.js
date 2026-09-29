const express = require('express');
const userSkillsController = require('../controllers/userskills.controller');
const router = express.Router();

router.post('/v1/add', userSkillsController.postAddUserSkills); // save data
router.post('/v1/getalldata', userSkillsController.getAllUserSkillsData); //get all user skills data
router.get('/v1/getbyid/:id', userSkillsController.getUserSkillsById); //get by id
router.get(
  '/v1/getbyuserid/:id',
  userSkillsController.getUserSkillsByUserMasterId
); //get by user id
router.post('/v1/updatebyid', userSkillsController.postUpdateUserSkills); //update user skills data
router.post('/v1/deletebyid', userSkillsController.postDeleteUserSkillsById); //delete by id
router.post('/v1/statuschanges', userSkillsController.poststatuschange); //status change
module.exports = router;
