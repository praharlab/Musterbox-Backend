const express = require('express');
const AnonymousFeedback = require('../controllers/anonymousFeedback.controller');
const router = express.Router();
const { uploadtask } = require('../middleware/upload');

router.post('/v1/add', AnonymousFeedback.postadd);
router.post('/v1/get', AnonymousFeedback.listdata);
// router.put('/v1/update', AnonymousFeedback.editdata);
router.get('/v1/getById/:id', AnonymousFeedback.getById);

module.exports = router;
