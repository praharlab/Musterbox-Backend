const express = require('express');
const preboardingFormCustomizeValueController = require('../controllers/preboardingfieldcustomizevalue.controller');
const router = express.Router();

router.get(
  '/v1/getbyid/:id',
  preboardingFormCustomizeValueController.getPreboardingIDCustomizeFieldValueById
); //get by id

module.exports = router;
