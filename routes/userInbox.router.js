const express = require('express');
const userInboxController = require('../controllers/userInbox.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');

const router = express.Router();

router.get('/v1/listTicketCategory', userInboxController.listTicketCategory);
router.get(
  '/v1/getUserInboxData',
  verifyChildParent,
  userInboxController.getUserInboxData
);
router.post(
  '/v1/delete',
  userInboxController.deleteData
);
module.exports = router;
