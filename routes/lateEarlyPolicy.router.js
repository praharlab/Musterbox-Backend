const express = require('express');
const LateEarlyPolicyController = require('../controllers/lateEarlyPolicy.controller');
const router = express.Router();

router.post('/v1/add', LateEarlyPolicyController.postAddLateEarlyPolicy); // add data
router.post('/v1/update', LateEarlyPolicyController.postUpdateLateEarlyPolicy); // update data
router.post(
  '/v1/statuschange',
  LateEarlyPolicyController.postStatusChangeLateEarlyPolicyById
); // status change
router.post('/v1/list', LateEarlyPolicyController.listLateEarlyPolicy); // list data
router.get('/v1/getbyid/:id', LateEarlyPolicyController.getLateEarlyPolicyById); //get by id
router.delete('/v1/deleteById/:id', LateEarlyPolicyController.deleteData); //delete by id

module.exports = router;
