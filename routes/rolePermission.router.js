const express = require('express');
const RolePermissionController = require('../controllers/rolePermission.controller');
const router = express.Router();

router.post('/v1/changePermissionData', RolePermissionController.changePermissionData);


module.exports = router;