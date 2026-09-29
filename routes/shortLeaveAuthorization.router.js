const express = require('express');
const shortLeaveAuthorization = require('../controllers/shortLeaveAuthorization.controller');
const router = express.Router();

router.post(
  '/v1/listShortLeaveAuthRequest',
  shortLeaveAuthorization.listShortLeaveAuthRequest
); // show data

router.get('/v1/getAuthorizationRequestByReferenceId/:id',shortLeaveAuthorization.getAuthorizationRequestByReferenceId);

router.post(
  '/v1/shortLeaveAcceptReject',
  shortLeaveAuthorization.shortLeaveAcceptReject
); // show data

module.exports = router;
