const express = require('express');
const customizeProfileController = require('../controllers/customizeProfile.controller');
const router = express.Router();

router.post('/v1/getCustomizeProfile', customizeProfileController.getcustomizeProfile);
router.put('/v1/updateCustomizeProfile', customizeProfileController.updateCustomizeProfile);

module.exports = router;