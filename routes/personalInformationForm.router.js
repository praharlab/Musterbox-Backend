const express = require('express');
const PersonalInformationFormController = require('../controllers/personalInformationForm.controller');
const router = express.Router();

router.post('/v1/downloadPersonalInformationForm', PersonalInformationFormController.downloadPersonalInformationForm); // save data

router.post('/v1/translateUserNames', PersonalInformationFormController.translateUserNames);
router.post('/v1/translateContractor', PersonalInformationFormController.translateContractor);
router.post('/v1/translateUserAddress', PersonalInformationFormController.translateUserAddress);
module.exports = router;
