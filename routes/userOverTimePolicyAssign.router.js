const express = require('express');
const userOverTimePolicyAssigncontroller = require('../controllers/userOverTimePolicyAssign.controller');
const router = express.Router();

router.post(
  '/v1/insert_data',
  userOverTimePolicyAssigncontroller.postAddUserOverTimePolicyAssign
);
router.post(
  '/v1/view_data',
  userOverTimePolicyAssigncontroller.postViewUserOverTimePolicyAssign
);
router.post(
  '/v1/update_data',
  userOverTimePolicyAssigncontroller.postUpdateUserOverTimePolicyAssign
);
router.get(
  '/v1/getbyid_data/:id',
  userOverTimePolicyAssigncontroller.getUserOverTimePolicyAssignById
);
router.post(
  '/v1/delete_data',
  userOverTimePolicyAssigncontroller.postDeleteUserOverTimePolicyAssignById
);
router.post(
  '/v1/status_change',
  userOverTimePolicyAssigncontroller.postChangeStatus
);
router.get(
  '/v1/getbyuserid/:id',
  userOverTimePolicyAssigncontroller.getOvertimePolicyByUserId
); // get data

module.exports = router;
