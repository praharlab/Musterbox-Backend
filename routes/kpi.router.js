const express = require('express');
const KPIController = require('../controllers/kpi.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  createKpiSchema,
  listKpiSchema,
  updateKpiSchema,
} = require('../validators/kpi');

const router = express.Router();
router.post(
  '/v1',
  validateSchema(createKpiSchema, reqObjectType.BODY),
  verifyChildParent,
  KPIController.createKPI
);
router.put(
  '/v1/:id',
  validateSchema(updateKpiSchema),
  verifyChildParent,
  KPIController.updateKPI
);
router.get('/v1/:id', verifyChildParent, KPIController.getKPIDetails);
router.get(
  '/v1',
  validateSchema(listKpiSchema, reqObjectType.QUERY),
  verifyChildParent,
  KPIController.listKPI
);
router.delete('/v1/:id', verifyChildParent, KPIController.deleteKPI);

module.exports = router;
