const express = require('express');
const GoalController = require('../controllers/goal.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  listGoalSchema,
  bulkCreateGoalKraKpiSchema,
  bulkUpdateGoalKraKpiSchema,
} = require('../validators/goal');

const router = express.Router();
router.get(
  '/v1/financialYearCalculation',
  GoalController.financialYearCalculation
);
router.post(
  '/v1',
  validateSchema(bulkCreateGoalKraKpiSchema),
  verifyChildParent,
  GoalController.bulkCreateGoalKraKpi
);

router.put(
  '/v1/:id',
  validateSchema(bulkUpdateGoalKraKpiSchema),
  verifyChildParent,
  GoalController.bulkUpdateGoalKraKpi
);
router.get('/v1/:id', verifyChildParent, GoalController.getGoalDetails);
router.get(
  '/v1',
  validateSchema(listGoalSchema, reqObjectType.QUERY),
  verifyChildParent,
  GoalController.listGoal
);
router.delete('/v1/:id', verifyChildParent, GoalController.deleteGoal);
module.exports = router;
