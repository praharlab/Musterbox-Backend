const express = require('express');
const customerController = require('../controllers/customer.controller');
const router = express.Router();
const { uploadfile } = require('../middleware/upload');

router.post('/v1/add', customerController.postAddCustomer); // save data
router.post('/v1/getalldata', customerController.getAllCustomerData); //get all customer data
router.get('/v1/getbyid/:id', customerController.getCustomerById); //get by id
router.post('/v1/getbycompanyid', customerController.getCustomerByCompanyId); //get by company id
router.post('/v1/updatebyid', customerController.postUpdateCustomer); //update customer data
router.post('/v1/deletebyid', customerController.postDeleteCustomerById); //delete by id
router.post('/v1/statuschanges', customerController.poststatuschange); //status change
router.post('/v1/uploadexcel', uploadfile, customerController.uploadCustomer); //upload
router.post(
  '/v1/getalldataoptimized',
  customerController.getAllCustomerDataOptimized
); //upload

router.post('/v1/getAllIndiaCityList', customerController.getAllIndiaCityList); //india city list

router.post(
  '/v1/validateExcel',
  uploadfile,
  customerController.validateUploadExcel
);

router.post('/v1/revalidateCustomer', customerController.revalidateCustomer);

router.post('/v1/addValidateCustomer', customerController.addValidateCustomer);

router.post('/v1/generateDemoExcel', customerController.generateDemoExcel);

module.exports = router;
