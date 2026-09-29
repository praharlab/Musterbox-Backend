const express = require('express');
const otherPaymentController = require('../controllers/otherpaymentdetails.controller');
const router = express.Router();

router.post('/v1/add', otherPaymentController.postAddOtherPaymentdata); // save data
router.post('/v1/getalldata', otherPaymentController.getallotherPaymentdata); //get all  data
router.post(
  '/v1/getcompanydata',
  otherPaymentController.getOtherPaymentByCompanyid
); //get  data by companyid
router.get('/v1/getbyid/:id', otherPaymentController.getotherPaymentById); //get by id
router.post('/v1/update', otherPaymentController.postUpdateOtherpayment); //update  data
router.get('/v1/delete/:id', otherPaymentController.postDeleteOtherPaymentById); //delete by id

module.exports = router;
