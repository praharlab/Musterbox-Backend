const express = require('express');
const AiBiometric = require('../controllers/aibiometric.controller');
const router = express.Router();
const { uploadtask } = require('../middleware/upload');

router.post('/v1/add', AiBiometric.postadd);
router.post('/v1/get', AiBiometric.listdata);
router.put('/v1/update', AiBiometric.editdata);
router.get('/v1/getById/:id', AiBiometric.getById);

module.exports = router;
