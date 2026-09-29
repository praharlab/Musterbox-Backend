const express = require('express');
const advancePaymentController = require('../controllers/advancePayment.controller');
const router = express.Router();

const { uploadfile } = require('../middleware/upload');
const { permissionAccess } = require('../middleware/permissionAccess');

router.post('/v1/add', advancePaymentController.postAddAdvancePaymentdata); // save data
router.post(
  '/v1/getcompanydata',
  permissionAccess,
  advancePaymentController.getadvanceByCompanyid
); //get  data by companyid
router.get('/v1/getbyid/:id', advancePaymentController.getAdvancePaymentById); //get by id
router.post('/v1/update', advancePaymentController.postUpdateAdvancepayment); //update  data
router.get(
  '/v1/delete/:id',
  advancePaymentController.postDeleteAdavancePaymentById
); //delete by id
router.post('/v1/statuschanges', advancePaymentController.poststatuschange); //status change
router.post('/v1/getuserdata', advancePaymentController.getadvanceByUserid); //get data by user id

router.post(
  '/v1/addd',
  advancePaymentController.postAddRequestAdvancePaymentdata
); // save data
router.post('/v1/statusreq', advancePaymentController.postStatusrequest); //get data by user id

router.post('/v1/advancedatashow', advancePaymentController.advancedatashow);

router.get('/v1/exportDemoexcel', advancePaymentController.exportDemoexcel);
router.post(
  '/v1/uploadExcel',
  uploadfile,
  advancePaymentController.uploadExcel
);

router.post(
  '/v1/validateExcel',
  uploadfile,
  advancePaymentController.validateUploadExcel
);

router.post(
  '/v1/revalidateAdvancePayment',
  advancePaymentController.revalidateAdvancePayment
);

router.post(
  '/v1/addValidateAdvancePayment',
  advancePaymentController.addValidateAdvancePayment
);

router.post('/v1/updateByReportee', advancePaymentController.updateByReportee); //update  data

router.post(
  '/v1/getuserAdavancedataForReporteeUser',
  advancePaymentController.getuserAdavancedataForReporteeUser
); //get data by user id

module.exports = router;
