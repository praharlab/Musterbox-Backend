const express = require('express');
const UserChats = require('../controllers/userChats.controller');
const router = express.Router();
const { uploadchatfile } = require('../middleware/upload');

router.post('/v1/postSendMessage', uploadchatfile, UserChats.postSendMessage); // to send msg
router.post('/v1/getuserList', UserChats.getuserList); // to get all user list
router.post('/v1/getuserWiseChat', UserChats.getuserWiseChat); // userwise chat history
router.post('/v1/postUpdatechatstoseen', UserChats.postUpdatechatstoseen); // seen msg
router.post('/v1/postdeletechat', UserChats.postdeletechat); // delete msg

module.exports = router;
