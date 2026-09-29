const express = require('express');
const extraDaysAuthorizationController = require('../controllers/extraDaysAuthorization.controller');
const router = express.Router();

router.get('/v1/getExtradaysAuthorizationRequestById/:id', extraDaysAuthorizationController.getExtradaysAuthorizationRequestById);
router.post('/v1/viewExtraDayAuthorizationByUserId', extraDaysAuthorizationController.viewExtraDayAuthorizationByUserId);
router.post('/v1/extraDaysAuthorizationacceptreject', extraDaysAuthorizationController.extraDaysAuthorizationacceptreject);
router.post('/v1/cancelExtraDayAuthorizationRequest', extraDaysAuthorizationController.cancelExtraDayAuthorizationRequest);

module.exports = router;