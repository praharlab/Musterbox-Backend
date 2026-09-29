const express = require('express');
const router = express.Router();
const RegistrationController = require('../controllers/registration.controller');

router.post('/v1/register', RegistrationController.postRegisterCompany); // Register data

module.exports = router;
