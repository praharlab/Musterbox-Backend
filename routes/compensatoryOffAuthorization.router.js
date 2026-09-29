const express = require('express');
const compensatoryOffAuthorizationController = require('../controllers/compensatoryOffAuthorization.controller');
const router = express.Router();

router.post(
  '/viewcompensatoryOffAuthorizationByUserId',
  compensatoryOffAuthorizationController.viewcompensatoryOffAuthorizationByUserId
);

router.post(
  '/compensatoryOffAuthorizationacceptreject',
  compensatoryOffAuthorizationController.compensatoryOffAuthorizationacceptreject
);

router.get(
  '/getcompensatoryOffAuthorizationRequestById/:id',
  compensatoryOffAuthorizationController.getcompensatoryOffAuthorizationRequestById
);

router.post(
  '/compensatoryOffAuthorizationuser',
  compensatoryOffAuthorizationController.compensatoryOffAuthorizationuser
);
// Add Coff Auth as set of Leave Auth
router.post(
  '/v1/addCoffAuth',
  compensatoryOffAuthorizationController.addCoffAuth
);

module.exports = router;
