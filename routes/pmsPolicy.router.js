const express = require('express');
const PmsPolicyController = require('../controllers/pmsPolicy.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  createPmsPolicySchema,
  updatePmsPolicySchema,
  listPmsPolicySchema,
} = require('../validators/pmsPolicy');

const router = express.Router();
router.post(
  '/v1',
  validateSchema(createPmsPolicySchema, reqObjectType.BODY),
  verifyChildParent,
  PmsPolicyController.createPmsPolicy
);
router.put(
  '/v1/:id',
  validateSchema(updatePmsPolicySchema, reqObjectType.BODY),
  verifyChildParent,
  PmsPolicyController.updatePmsPolicy
);
router.get(
  '/v1',
  validateSchema(listPmsPolicySchema, reqObjectType.QUERY),
  verifyChildParent,
  PmsPolicyController.listPmsPolicy
);
router.get(
  '/v1/:id',
  verifyChildParent,
  PmsPolicyController.getPmsPolicyDetails
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  PmsPolicyController.deletePmsPolicy
);
module.exports = router;
