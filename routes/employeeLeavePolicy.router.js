const express = require('express');
const employeeLeavePolicy = require('../controllers/employeeLeavePolicy.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');

const router = express.Router();
router.post(
  '/v1',
  verifyChildParent,
  employeeLeavePolicy.createEmployeeLeavePolicy
); // save data
router.get(
  '/v1',
  verifyChildParent,
  employeeLeavePolicy.listEmployeeLeavePolicy
); //get all employee leave Policy data
router.get(
  '/v1/getdatabyusercompany/:id',
  employeeLeavePolicy.getHrLeaveTypesByComp
); //HRLeave By user Company
router.put(
  '/v1/:id',
  verifyChildParent,
  employeeLeavePolicy.updateEmployeeLeavePolicy
); //update EmployeeLeavePolicy data
router.delete(
  '/v1/:id',
  verifyChildParent,
  employeeLeavePolicy.deleteEmployeeLeavePolicy
); //delete by id

router.get(
  '/v1/:id',
  verifyChildParent,
  employeeLeavePolicy.getEmpLeavePolicyDetails
); //get by id
// router.get(
//   '/v1/getactivleavebycompanyid/:id',
//   employeeLeavePolicy.changeStatusByDate
// );

router.get(
  '/v1/getLeavePolicyBycompany/:id',
  employeeLeavePolicy.getLeavePolicyBycompany
);

router.post('/v1/leaveencash',employeeLeavePolicy.employeeLeavePolicyCron)

module.exports = router;
