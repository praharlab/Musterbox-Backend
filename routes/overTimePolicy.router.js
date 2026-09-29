const express = require('express');
const overTimePolicycontroller = require('../controllers/overTimePolicy.controller');
const router = express.Router();

router.post('/v1/insert_data', overTimePolicycontroller.postAddOverTimePolicy);
router.post('/v1/view_data', overTimePolicycontroller.postViewOverTimePolicy);
router.post(
  '/v1/update_data',
  overTimePolicycontroller.postUpdateOverTimePolicy
);
router.get(
  '/v1/getbyid_data/:id',
  overTimePolicycontroller.getOverTimePolicyById
);
router.get(
  '/v1/delete_data/:id',
  overTimePolicycontroller.postDeleteOverTimePolicyById
);
router.post('/v1/status_change', overTimePolicycontroller.postChangeStatus);

module.exports = router;
