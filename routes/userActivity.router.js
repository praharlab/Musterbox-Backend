const express = require('express');
const { listUserActivity } = require('../controllers/userActivity');
const { verifyToken } = require('../middleware/tokenverify');

const router = express.Router();
router.get('/v1', verifyToken, listUserActivity);
module.exports = router;
