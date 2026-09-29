const express = require('express');
const letterHeadController = require('../controllers/letterHead.controller');
const router = express.Router();

router.post('/v1/add', letterHeadController.AddletterHead);
router.post('/v1/update', letterHeadController.postUpdateLetterHead);
router.post('/v1/delete', letterHeadController.postDeleteLetterheadById);
router.get('/v1/getbyid/:id', letterHeadController.getbyLetterheadId);
router.post('/v1/getalldata', letterHeadController.getalldatabyCompanyId);

module.exports = router;
