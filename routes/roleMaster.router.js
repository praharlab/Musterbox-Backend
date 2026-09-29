const express = require('express');
const RoleMasterController = require('../controllers/roleMaster.controller');
const router = express.Router();

router.post('/v1/postAddRoleMaster', RoleMasterController.postAddRoleMaster);
router.get('/v1/getRoleMasterById/:id', RoleMasterController.getRoleMasterById);
router.post(
  '/v1/postUpdateRoleMaster',
  RoleMasterController.postUpdateRoleMaster
);
router.post('/v1/listRoleMaster', RoleMasterController.listRoleMaster);
router.post('/v1/AssignRoleMaster', RoleMasterController.AssignRoleMaster);
router.post('/v1/listUserPermission', RoleMasterController.listUserPermission);

module.exports = router;
