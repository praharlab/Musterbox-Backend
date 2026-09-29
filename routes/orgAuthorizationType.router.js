const express = require('express');
const orgAuthorizationTypeController = require('../controllers/orgAuthorizationType.controller');
const router = express.Router();

router.post(
    '/v1/add',
    orgAuthorizationTypeController.addOrgAuthorizationType
);
router.post(
    '/v1/getalldata',
    orgAuthorizationTypeController.getOrgAuthorizationType
);
router.get(
    '/v1/getbyid/:id',
    orgAuthorizationTypeController.getOrgAuthorizationTypeById
);
router.post(
    '/v1/updatebyid',
    orgAuthorizationTypeController.updateOrgAuthorizationType
);
router.delete(
    '/v1/deletebyid/:id',
    orgAuthorizationTypeController.deleteOrgAuthorizationType
);
router.post('/v1/statuschange', orgAuthorizationTypeController.poststatuschange);

module.exports = router;
