const express = require('express');
const ticketCategoryController = require('../controllers/ticketCategory.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { roles } = require('../utils/commonVars');

const router = express.Router();
router.get(
  '/v1',
  verifyChildParent,
  ticketCategoryController.listTicketCategory
);
router.get(
  '/v1/:id',
  verifyChildParent,
  ticketCategoryController.getTicketCategoryDetails
);
router.post(
  '/v1',
  verifyChildParent,
  ticketCategoryController.createTicketCategory
);
router.put(
  '/v1/:id',
  verifyChildParent,
  ticketCategoryController.updateTicketCategory
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  ticketCategoryController.deleteTicketCategory
);
module.exports = router;
