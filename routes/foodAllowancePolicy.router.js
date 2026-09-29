const express = require('express');
const foodAllowancePolicyController = require('../controllers/foodAllowancePolicy.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const router = express.Router();

router.post('/v1/addData', foodAllowancePolicyController.addData);
router.put('/v1/updateData/:id', foodAllowancePolicyController.updateData);
router.get(
  '/v1/listData',
  verifyChildParent,
  foodAllowancePolicyController.listData
);
router.delete('/v1/deleteData/:id', foodAllowancePolicyController.deleteData);
router.get('/v1/getById/:id', foodAllowancePolicyController.getById);
router.post('/v1/updateStatus', foodAllowancePolicyController.updateStatus);
router.post('/v1/addFoodAllow', foodAllowancePolicyController.addFoodAllow);

module.exports = router;
