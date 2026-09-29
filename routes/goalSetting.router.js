const express = require('express');
const GoalSettingController = require('../controllers/goalSetting.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  createGoalSettingSchema,
  listGoalSettingSchema,
  updateGoalSettingSchema,
} = require('../validators/goalSetting');

const router = express.Router();

router.post(
  '/v1',
  validateSchema(createGoalSettingSchema),
  verifyChildParent,
  GoalSettingController.createGoalSetting
);
router.put(
  '/v1/:id',
  validateSchema(updateGoalSettingSchema),
  verifyChildParent,
  GoalSettingController.updateGoalSetting
);
router.get(
  '/v1/:id',
  verifyChildParent,
  GoalSettingController.getGoalSettingDetails
);
router.get(
  '/v1',
  validateSchema(listGoalSettingSchema, reqObjectType.QUERY),
  verifyChildParent,
  GoalSettingController.listGoalSetting
);
router.delete(
  '/v1/:id',
  verifyChildParent,
  GoalSettingController.deleteGoalSetting
);
module.exports = router;
