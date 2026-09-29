const express = require('express');
const skillSetsController = require('../controllers/skillsets.controllers');
const { uploadfile } = require('../middleware/upload');

const router = express.Router();
router.post('/v1/addskillset', skillSetsController.addSkillSet); // to add skillset
router.post('/v1/getallskillset', skillSetsController.getAllSkillSet); // to get all skill list
router.get('/v1/getskillsetbyid/:id', skillSetsController.getSkillSetById); // to get by id
router.post('/v1/updatebyid', skillSetsController.updateSkillSet); // update skill data
router.post('/v1/deletebyid', skillSetsController.deleteSkillSetById); // delete by id
router.post('/v1/statuschanges', skillSetsController.statuschange); // status change
router.post('/v1/uploadexcel', uploadfile, skillSetsController.uploadexcel);
router.post(
  '/v1/getAllSkillSetUsingCompanyID',
  skillSetsController.getAllSkillSetUsingCompanyID
);

module.exports = router;
