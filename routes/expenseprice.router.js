const express = require('express');
const experiansepriceController = require('../controllers/expenseprice.controller');
const router = express.Router();

router.post('/v1/add', experiansepriceController.postAddExpensePriceRule); // save data
router.post(
  '/v1/getalldata',
  experiansepriceController.getAllExpensePriceRuleData
); //get all emplyee designation data
router.get(
  '/v1/getbyid/:id',
  experiansepriceController.getExpensePriceRuleById
); //get by id
router.get(
  '/v1/getbyheadid/:id',
  experiansepriceController.getExpensePriceRuleByHeadId
); //get by user id
router.post(
  '/v1/updatebyid',
  experiansepriceController.postUpdateExpensePriceRule
); //update emplyee designation data
router.post(
  '/v1/deletebyid',
  experiansepriceController.postDeleteExpensePriceRuleById
); //delete by id
router.post('/v1/statuschanges', experiansepriceController.poststatuschange); //status change
router.get(
  '/v1/getExpensePriceRuleByHeadid/:id',
  experiansepriceController.getExpensePriceRuleByHeadid
); //status change

module.exports = router;
