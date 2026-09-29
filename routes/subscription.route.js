const express = require('express');

const { verifyChildParent } = require('../middleware/verifyChildParent');
const subscriptionMasterController = require('../controllers/subscription.controller');
const router = express.Router();

router.post('/v1/add', subscriptionMasterController.postAddSubscription); // save data
router.post(
  '/v1/getalldata',
  subscriptionMasterController.getAllSubscriptionData
); //get all product data
router.get('/v1/getbyid/:id', subscriptionMasterController.getSubscriptionById); //get by id
router.post(
  '/v1/updatebyid',
  subscriptionMasterController.postUpdateSubscription
); //update product data
router.post(
  '/v1/deletebyid',
  subscriptionMasterController.postDeleteSubscriptionById
); //delete by id
router.post('/v1/statuschanges', subscriptionMasterController.poststatuschange); //status by id

router.get(
  '/v1/getSubscriptionPlanExpiration',
  verifyChildParent,
  subscriptionMasterController.getSubscriptionPlanExpiration
); // check SubscriptionPlan Expiration

router.post(
  '/v1/AssignWeekOffHoliday',
  subscriptionMasterController.AssignWeekOffHoliday
); //status by id

router.post(
  '/v1/getActiveSubscription',
  subscriptionMasterController.getActiveSubscription
);

module.exports = router;
