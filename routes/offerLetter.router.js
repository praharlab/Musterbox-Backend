const express = require('express');
const OfferLetterController = require('../controllers/offerLetter.controller');
const router = express.Router();

router.post('/v1/add', OfferLetterController.addOfferLetter);
router.post('/v1/update', OfferLetterController.updateOfferLetter);
router.post('/v1/delete', OfferLetterController.deleteOfferLetter);
router.post('/v1/get', OfferLetterController.getOfferLetter);

module.exports = router;
