const express = require('express');
const joiningLetterController = require('../controllers/joiningLetter.controller');
const router = express.Router();

router.post('/v1/add', joiningLetterController.addJoiningLetter);
router.post('/v1/update', joiningLetterController.updateJoiningLetter);
router.post('/v1/delete', joiningLetterController.deleteJoiningLetter);
router.post('/v1/get', joiningLetterController.getJoiningLetter);

module.exports = router;
