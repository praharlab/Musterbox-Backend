const express = require('express');
const TerminationLetter = require('../controllers/terminationLetter.controller');
const router = express.Router();

router.post('/v1/add', TerminationLetter.addTerminationLetter);
router.put('/v1/update', TerminationLetter.updateTerminationLetter);
router.post('/v1/delete', TerminationLetter.deleteTerminationLetter);
router.post('/v1/get', TerminationLetter.getTerminationLetter);

module.exports = router;
