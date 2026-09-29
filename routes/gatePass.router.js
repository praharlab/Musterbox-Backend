const express = require('express');
const gatePassController = require('../controllers/gatePass.controller');
const router = express.Router();
const { verifyChildParent } = require('../middleware/verifyChildParent');

router.post('/v1/add', gatePassController.postAddgatePass); // save data
router.get('/v1/getbyid/:id', gatePassController.getgatePassId); //get by id
router.post('/v1/updatebyid', gatePassController.postUpdategatePass); //update companytype tax data
router.post('/v1/deletebyid', gatePassController.postDeletegatePassById); //delete by id
router.post('/v1/statuschanges', gatePassController.poststatuschange); //status by id

router.post(
  '/v1/getgatePasscompanyid',
  verifyChildParent,
  gatePassController.getgatePasscompanyid
); //get by id

router.post('/v1/getgatePassuser', gatePassController.getgatePassuser); //get by id
router.get(
  '/v1/getgatePassByCompanyId/:id',
  gatePassController.getgatePassByCompanyId
); //get by id
router.get(
  '/v1/getactivegatePassbycompanyid/:id',
  gatePassController.getactivegatePassbycompanyid
);
router.post('/v1/getbyusermasterid', gatePassController.getpassByuserId);
router.post('/v1/updatebyid1', gatePassController.postUpdategatePass1); //update companytype tax data

router.post('/v1/gatepassdashboard', gatePassController.gatePassDashboard);

module.exports = router;
