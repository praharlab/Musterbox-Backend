const express = require('express');
const DiscrepancyLetterController = require('../controllers/discrepancyLetter.controller');
const router = express.Router();

router.post('/v1/addDiscrepancyLetter', DiscrepancyLetterController.addDiscrepancyLetter);
router.put('/v1/updateDiscrepancyLetter', DiscrepancyLetterController.updateDiscrepancyLetter);
router.post('/v1/deleteDiscrepancyLetter', DiscrepancyLetterController.deleteDiscrepancyLetter);
router.post('/v1/getDiscrepancyLetter', DiscrepancyLetterController.getDiscrepancyLetter);
router.post('/v1/getDiscrepancyLetterByID', DiscrepancyLetterController.getDiscrepancyLetterByID);

module.exports = router;