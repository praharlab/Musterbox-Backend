const express = require('express');
const authorizationRequestController = require('../controllers/gatePassAuthorization.controller');
const router = express.Router();

router.post(
  '/gatepassauthorizationrequest',
  authorizationRequestController.viewAuthorizationRequestByUserIdForGatePass
);

router.post(
  '/authorizationacceptreject',
  authorizationRequestController.authorizationacceptrejectGatePass
);

router.get(
  '/gatepassrequestdatabyid/:id',
  authorizationRequestController.getAuthorizationRequestById
);

router.post(
  '/gatePassAuthorizeduser',
  authorizationRequestController.GatePassAuthorizeduser
);

module.exports = router;
