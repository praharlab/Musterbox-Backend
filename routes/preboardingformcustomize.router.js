const express = require('express');
const preboardingformcustomizeController = require('../controllers/preboardingformcustomize.controller');
const { verifyToken } = require('../middleware/tokenverify');
const router = express.Router();

router.post(
  '/v1/getbycompanyid',
  preboardingformcustomizeController.getPreboardingFormCustomizeByCompanyId
); //get by company id


router.post(
  '/v1/getPreboardingFormCustomizeByCompanyBySecretKey',
  preboardingformcustomizeController.getPreboardingFormCustomizeByCompanyBySecretKey
); //get by company id
module.exports = router;
