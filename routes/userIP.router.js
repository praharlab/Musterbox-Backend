const express = require('express');
// const AnonymousFeedback = require('../controllers/anonymousFeedback.controller');
const UserIp = require('../controllers/userIP.controller');
const router = express.Router();

router.post('/v1/add', UserIp.postadd);
router.post('/v1/get', UserIp.listdata);
router.get('/v1/getById/:id', UserIp.getById);
router.put('/v1/editdata/:id', UserIp.editdata);
router.delete('/v1/deleteip', UserIp.deleteip);

module.exports = router;
