const express = require('express');
const authorizationRequestController = require('../controllers/leaveAuthorization.controller');
const router = express.Router();

router.post(
  '/v1/getbyuserid',
  authorizationRequestController.viewauthorizationrequestbyuserid
); // not used in web

router.post(
  '/v2/getbyuserid',
  authorizationRequestController.listLeaveAuthRequest
); // not used in web

router.post(
  '/v2/listLeaveAuthRequestNew',
  authorizationRequestController.listLeaveAuthRequestNew
); // not used in web

//------------------------out door duty ---------------------

router.post(
  '/v1/listOutdoorDutyAuthRequest',
  authorizationRequestController.listOutdoorDutyAuthRequest
); // show data

router.post(
  '/v1/acceptRejectOutdoorDuty',
  authorizationRequestController.acceptRejectOutdoorDuty
); // Acccept Reject data

router.post(
  '/v1/outdoorDutyCancellation',
  authorizationRequestController.outdoorDutyCancellation
);

// ----------------------------------------

router.post(
  '/v1/authorizationacceptreject',
  authorizationRequestController.authorizationacceptreject
); // Acccept Reject data

router.get(
  '/v1/getAuthorizationRequestByReferanceId/:id',
  authorizationRequestController.getAuthorizationRequestByReferanceId
);
router.get('/v1/checkapi', authorizationRequestController.checkapi); // not used in web
router.get('/v1/leavedetails/:id', authorizationRequestController.leavedetails);

router.get(
  '/v1/leaveAuthCriteria/:id',
  authorizationRequestController.leaveAuthCriteria
); //not used in web

router.post(
  '/v1/leaveAuthorizeduser',
  authorizationRequestController.leaveAuthorizeduser
);
router.post(
  '/v1/mobileauthuserforleave',
  authorizationRequestController.mobileauthuserforleave
);
router.post(
  '/v1/leavecancellist',
  authorizationRequestController.leavecancellist
);
router.post('/v1/leavecancel', authorizationRequestController.leavecancel);

router.post(
  '/v1/updateViewStatus',
  authorizationRequestController.updateViewStatus
);

router.post(
  '/v1/countpending',
  authorizationRequestController.countPendingRequests
);

router.get(
  '/v1/requestCountforHRdashboard',
  authorizationRequestController.requestCountforHRdashboard
);

router.post('/v1/leavedatashow', authorizationRequestController.leavedatashow);

router.get(
  '/v1/getAuthorizationRequestByAuthorizationRequestId/:id',
  authorizationRequestController.getAuthorizationRequestByAuthorizationRequestId
);
router.get(
  '/v1/getApprovedAuthorizationRequestByUserLeaveApplicationID/:id',
  authorizationRequestController.getApprovedAuthorizationRequestByUserLeaveApplicationID
);
module.exports = router;
