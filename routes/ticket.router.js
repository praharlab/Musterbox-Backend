const express = require('express');
const ticketController = require('../controllers/ticket.controller');
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { roles } = require('../utils/commonVars');
const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/ticket-attachments'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png', 'video/mp4']
);
const router = express.Router();
router.get('/v1', verifyChildParent, ticketController.listTicket);
router.get('/v1/report', verifyChildParent, ticketController.getTicketReport);
router.get('/v1/:id', verifyChildParent, ticketController.getTicketDetails);
router.post(
  '/v1',
  verifyChildParent,
  multerMiddleware.array('attachments', 5),
  handleMulterErrors,
  ticketController.createTicket
);
router.put(
  '/v1/:id',
  verifyChildParent,
  multerMiddleware.none(),
  handleMulterErrors,
  ticketController.updateTicket
);
// Removed delete functionality for ticket
// router.delete(
//   '/v1/:id',
//   verifyChildParent,
//   ticketController.deleteTicket
// );
router.post(
  '/v1/:id/updates',
  verifyChildParent,
  multerMiddleware.array('attachments', 5),
  handleMulterErrors,
  ticketController.createTicketUpdate
);
router.post('/v1/alldata', verifyChildParent, ticketController.Allticketdata);
//router

module.exports = router;
