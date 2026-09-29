const express = require('express');
const UserResignation = require('../controllers/resignation.controller');
const { uploadresignation } = require('../middleware/upload');

const router = express.Router();

router.post(
  '/v1/add',
  uploadresignation,
  UserResignation.postAddUserResignation
);

router.put(
  '/v1/update/:id',
  uploadresignation,
  UserResignation.updateUserResignation
);
router.put(
  '/v1/updaterelievingdate/:id',
  uploadresignation,
  UserResignation.updateRelievingDate
);

router.post('/v1/getAll', UserResignation.getAllResignationbyAuth);
router.post('/v1/rejectResignation', UserResignation.postRejectResignation);
router.post('/v1/acceptResignation', UserResignation.postAcceptResignation);
router.get(
  '/v1/getResignationByUserId/:id',
  UserResignation.getResignationByUserId
);
router.get(
  '/v1/getauthdatabyid/:id',
  UserResignation.getAuthorizationRequestById
);
router.post('/v1/cancelResignation', UserResignation.postCancelResignationById);

router.post(
  '/v1/postDeleteResignationById',
  UserResignation.postDeleteResignationById
);

router.get(
  '/v1/getresignationtaskbyid/:id',
  UserResignation.getResignationTaskById
);

router.post(
  '/v1/resignationAuthorizeduser',
  UserResignation.resignationAuthorizeduser
);

router.post(
  '/resignationAuthorizationacceptreject',
  UserResignation.resignationAuthorizationacceptreject
);
module.exports = router;
