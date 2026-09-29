const express = require('express');
const depositController = require('../controllers/deposit.controller');
const router = express.Router();

router.post('/v1/add', depositController.postAddDeposit); // save data
router.get('/v1/getbyid/:id', depositController.getDepositId); //get by id
router.post('/v1/updatebyid', depositController.postUpdateDeposit); //update companytype tax data
router.post('/v1/deletebyid', depositController.postDeleteDepositById); //delete by id
router.post('/v1/statuschanges', depositController.poststatuschange); //status by id
router.post('/v1/getDepositcompanyid', depositController.getDepositcompanyid); //get by id
router.get(
  '/v1/getDepositByCompanyId/:id',
  depositController.getDepositByCompanyId
); //get by id
router.get(
  '/v1/getactivedepartmentbycompanyid/:id',
  depositController.getactivedepositbycompanyid
);
router.post('/v1/getDepositByUserId', depositController.getDepositByuserid); // get by user

module.exports = router;
