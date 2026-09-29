const express = require('express');
const empLeavePolicyController = require('../controllers/empLeavePolicy.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const router = express.Router();

router.post('/v1/addData', empLeavePolicyController.addData);
router.get(
  '/v1/getEmpLeavePolicyByUserId/:id',
  empLeavePolicyController.getEmpLeavePolicyByUserId
);
router.get(
  '/v1/getEmpLeavePolicyByCompany',
  verifyChildParent,
  empLeavePolicyController.getEmpLeavePolicyByCompany
);

router.get(
  '/v1/getCurrentEmployeeLeavePolicy/:id',
  empLeavePolicyController.getCurrentEmployeeLeavePolicy
);

module.exports = router;
