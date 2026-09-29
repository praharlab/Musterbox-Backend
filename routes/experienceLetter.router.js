const express = require('express');
const ExperienceLetter = require('../controllers/experienceLetter.controller');
const router = express.Router();

router.post('/v1/add', ExperienceLetter.addExperienceLetter);
router.put('/v1/update', ExperienceLetter.updateExperienceLetter);
router.post('/v1/delete', ExperienceLetter.deleteExperienceLetter);
router.post('/v1/get', ExperienceLetter.getExperienceLetter);

module.exports = router;
