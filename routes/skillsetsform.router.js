const express = require('express');
const router = express.Router();
const skillSetsFormController = require('../controllers/skillsetsform.controller');

router.post('/v1/add', skillSetsFormController.AddSkillSetsForm);
router.post('/v1/updatebyid', skillSetsFormController.UpdateSkillSetsForm);
//router.post('/v1/deletebyid', skillSetsFormController.DeleteSkillSetsFormById); //delete by id
router.post('/v1/getalldata', skillSetsFormController.getAllSkillSetsFormData); //get all visitFormCustomizeValue data
router.get('/v1/getbyid/:id', skillSetsFormController.getSkillSetsFormById); //get by id
router.post(
  '/v1/getbycompanyid',
  skillSetsFormController.getSkillSetsFormByCompanyId
); //get by company id
router.post('/v1/getskillsets', skillSetsFormController.getSkillSets); //get by company id
//router.post('/v1/statuschange', skillSetsFormController.statuschange); //get by company id

module.exports = router;
