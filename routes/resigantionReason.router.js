const express = require('express');
const resigantionReason = require('../controllers/resigantionReason.controller');
const { uploadresignation } = require('../middleware/upload');

const router = express.Router();

router.post('/v1/add', resigantionReason.postAddResignationReason);

router.put('/v1/edit/:id', resigantionReason.updateResigantionReason);

router.post('/v1/getall', resigantionReason.getAllResigantionReason);

router.get('/v1/getbyid/:id', resigantionReason.getResigantionReasonById);

router.post('/v1/delete', resigantionReason.postDeleteResignationReason);

module.exports = router;