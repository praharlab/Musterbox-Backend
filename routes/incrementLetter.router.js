const express = require('express');
const IncrementLetter = require('../controllers/incrementLetter.controller');
const router = express.Router();

router.post('/v1/add', IncrementLetter.addIncrementLetter);
router.put('/v1/update', IncrementLetter.updateIncrementLetter);
router.post('/v1/delete', IncrementLetter.deleteIncrementLetter);
router.post('/v1/get', IncrementLetter.getIncrementLetter);

module.exports = router;
