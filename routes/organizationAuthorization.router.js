const express = require('express');
const organizationAuthorizationController = require('../controllers/organizationAuthorization.controller');
const router = express.Router();

router.post(
    '/v1/add',
    organizationAuthorizationController.addOrganizationAuthorization
);
router.post(
    '/v1/getalldata',
    organizationAuthorizationController.getAllOrganizationAuthorization
);
router.get(
    '/v1/getbyid/:id',
    organizationAuthorizationController.getOrganizationAuthorizationById
);
router.put(
    '/v1/updatebyid',
    organizationAuthorizationController.updateOrganizationAuthorizationById
);
router.post(
    '/v1/deletebyid',
    organizationAuthorizationController.deleteOrganizationAuthorization
);

module.exports = router;
