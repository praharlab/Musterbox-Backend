const express = require('express');
const router = express.Router();
const monthlySkillsetsformController = require('../controllers/monthlySkillsetsform.controller');

router.post('/v1/add', monthlySkillsetsformController.addmonthlySkillsetsform);
router.post('/v1/getall', monthlySkillsetsformController.getAllData);
router.post(
  '/v1/addSkillsetsAnswers',
  monthlySkillsetsformController.addSkillsetsAnswers
);
router.post(
  '/v1/verifySkillsetsAnswers',
  monthlySkillsetsformController.verifySkillsetsAnswers
);
router.get(
  '/v1/getbymonthlySkillsetsid/:id',
  monthlySkillsetsformController.getbymonthlySkillsetsid
);
// router.post('/v1/getbyReportToid', monthlySkillsetsformController.getbyReportToid);
router.post('/v1/getbyuserid', monthlySkillsetsformController.getbyuserid);
router.post(
  '/v1/getbyreporttoid',
  monthlySkillsetsformController.getbyreporttoid
);

router.post(
  '/v1/updateaSkillsetsAnswers',
  monthlySkillsetsformController.UpdateaSkillsetsAnswers
);

router.post(
  '/v1/skillsetsReport',
  monthlySkillsetsformController.SkillsetsReport
);
router.post(
  '/v1/userSkillsetsReport',
  monthlySkillsetsformController.UserSkillsetsReport
);

module.exports = router;
