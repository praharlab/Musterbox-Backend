const express = require('express');
const ticketSubCategoryController = require('../controllers/ticketSubCategory.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { roles } = require('../utils/commonVars');

const router = express.Router();
router.get(
  '/v1',
  verifyChildParent,
  ticketSubCategoryController.listTicketSubCategory
);
router.get(
  '/v1/:id',
  verifyChildParent,
  ticketSubCategoryController.getTicketSubCategoryDetails
);
router.post(
  '/v1',
  verifyChildParent,
  ticketSubCategoryController.createTicketSubCategory
);
router.put(
  '/v1/:id',
  verifyChildParent,
  ticketSubCategoryController.updateTicketSubCategory
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  ticketSubCategoryController.deleteTicketSubCategory
);
module.exports = router;
