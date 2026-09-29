const express = require('express');
const router = express.Router();
const EmployeeGatepassControllter = require('../controllers/employeeGatepass.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { configureMulter, handleMulterErrors } = require('../middleware/multer');
const { validateSchema } = require('../middleware/validateSchema');
const {
  createEmployeeGatepassSchema,
  updateEmployeeGatepassSchema,
  listEmployeeGatepassSchema,
} = require('../validators/employeeGatepass');
const { reqObjectType } = require('../utils/commonVars');

const path = require('path');

const multerMiddleware = configureMulter(
  path.join(__dirname, '../uploads/employee-gatepass'),
  1024 * 1024 * 10,
  ['image/jpeg', 'image/png']
);

router.post(
  '/v1',
  validateSchema(createEmployeeGatepassSchema, reqObjectType.BODY),
  verifyChildParent,
  EmployeeGatepassControllter.createEmployeeGatepass
);

router.post(
  '/addmygatepass',
  validateSchema(createEmployeeGatepassSchema, reqObjectType.BODY),
  verifyChildParent,
  EmployeeGatepassControllter.createMyGatepass
);

router.put(
  '/updatebyid/:id',
  validateSchema(updateEmployeeGatepassSchema),
  verifyChildParent,
  EmployeeGatepassControllter.updateMyGatepass
);

router.put(
  '/v1/:id',
  validateSchema(updateEmployeeGatepassSchema),
  verifyChildParent,
  EmployeeGatepassControllter.updateEmployeeGatepass
);

router.get(
  '/v1/:id',
  verifyChildParent,
  EmployeeGatepassControllter.getEmployeeGatepassDetails
);

router.get(
  '/v1',
  validateSchema(listEmployeeGatepassSchema, reqObjectType.QUERY),
  verifyChildParent,
  EmployeeGatepassControllter.listEmployeeGatepass
);

router.delete(
  '/v1/:id',
  verifyChildParent,
  EmployeeGatepassControllter.deleteEmployeeGatepass
);

router.post(
  '/v1/update',
  verifyChildParent,
  multerMiddleware.array('attachment', 1),
  handleMulterErrors,
  EmployeeGatepassControllter.employeeGatePassCheckInCheckOut
);

module.exports = router;
