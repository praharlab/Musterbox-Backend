const express = require('express');
const empLetterHeadController = require('../controllers/empLetterHead.controller');
const router = express.Router();

router.post('/v1/add', empLetterHeadController.AddempLetterHead);
router.post('/v1/update', empLetterHeadController.postUpdateEmpLetter);
router.post('/v1/delete', empLetterHeadController.postDeleteLetterById);
router.get('/v1/getbyid/:id', empLetterHeadController.getbyLetterId);
router.post('/v1/getbyuserid', empLetterHeadController.getLetterDataByUserId);

module.exports = router;
